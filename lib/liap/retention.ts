import { getDb } from '@/lib/db/client'
import { recordAuditEvent } from '@/lib/audit'

// ---------------------------------------------------------------------------
// Free-text retention for the assessment. §27.
//
// Ninety days after an assessment is completed, the raw narrative answers are
// deleted. What survives is the version, the scores, the classifications, the
// Life Project Position, the Protect/Resolve/Move result and the plan — so the
// customer's report still opens and still means what it meant, while the
// sentences they wrote about their marriage, their diagnosis or their
// redundancy are gone.
//
// This is possible in one statement only because assessment_narratives holds
// free text and nothing else. Had the narratives been columns on the
// assessment row, this would be an UPDATE touching five nullable fields, and
// the sixth added later would be forgotten.
//
// The purge is audited as a COUNT. Logging what was deleted would recreate,
// in the audit table, exactly the record the purge exists to remove.
// ---------------------------------------------------------------------------

export interface NarrativePurgeResult {
  assessments: number
  narratives: number
  dryRun: boolean
}

/** Assessments whose free text is due, with a count of what would go. */
export async function findDueNarratives(): Promise<Array<{ assessment_id: string; rows: number }>> {
  return getDb().query<{ assessment_id: string; rows: number }>(
    `SELECT n.assessment_id, count(*)::int AS rows
       FROM assessment_narratives n
       JOIN assessments a ON a.id = n.assessment_id
      WHERE a.narrative_purge_after IS NOT NULL
        AND a.narrative_purge_after <= now()
      GROUP BY n.assessment_id
      ORDER BY n.assessment_id`
  )
}

export async function purgeExpiredNarratives(
  options: { dryRun?: boolean } = {}
): Promise<NarrativePurgeResult> {
  const dryRun = options.dryRun ?? false
  const due = await findDueNarratives()

  if (dryRun) {
    return {
      assessments: due.length,
      narratives: due.reduce((sum, row) => sum + row.rows, 0),
      dryRun: true,
    }
  }

  const deleted = await getDb().query<{ assessment_id: string }>(
    `DELETE FROM assessment_narratives n
      USING assessments a
      WHERE a.id = n.assessment_id
        AND a.narrative_purge_after IS NOT NULL
        AND a.narrative_purge_after <= now()
      RETURNING n.assessment_id`
  )

  const assessments = new Set(deleted.map((r) => r.assessment_id)).size

  if (deleted.length > 0) {
    // Count only. Never the text, never the assessment ids — an id plus a
    // timestamp is enough to re-identify someone against the other tables.
    await recordAuditEvent({
      eventType: 'liap.narratives_purged',
      metadata: { reason: 'narrative_retention_expired', count: deleted.length },
    })
  }

  return { assessments, narratives: deleted.length, dryRun: false }
}

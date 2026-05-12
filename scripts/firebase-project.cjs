const CRO_PROJECT_ID_PATTERN = /^fifa-wc-2026-[a-z0-9]+$/

function requireFirebaseProjectId() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT

  if (!projectId) {
    throw new Error(
      'Set FIREBASE_PROJECT_ID to the USA Firebase project id before running this script.',
    )
  }

  if (CRO_PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error(`Refusing to run against blocked CRO Firebase project: ${projectId}`)
  }

  return projectId
}

module.exports = { requireFirebaseProjectId }

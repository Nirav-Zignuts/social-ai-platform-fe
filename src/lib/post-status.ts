import type { GeneratedPostStatus } from "./types";

export function getStatusColor(status: GeneratedPostStatus | string): string {
  switch (status) {
    case "PENDING_REVIEW":
    case "REVIEWER_PASSED":
      return "var(--status-pending)";
    case "APPROVED":
    case "PUBLISHED":
      return "var(--status-approved)";
    case "REJECTED":
    case "FAILED":
    case "REVIEWER_FAILED":
      return "var(--status-rejected)";
    case "DRAFT":
    case "SKIPPED":
    default:
      return "var(--status-draft)";
  }
}

export function getStatusLabel(status: GeneratedPostStatus | string): string {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    REVIEWER_PASSED: "Reviewer Passed",
    REVIEWER_FAILED: "Reviewer Failed",
    PENDING_REVIEW: "Pending Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    PUBLISHED: "Published",
    FAILED: "Failed",
    SKIPPED: "Skipped",
  };
  return labels[status] ?? status;
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "var(--status-approved)";
  if (score >= 50) return "var(--status-pending)";
  return "var(--status-rejected)";
}

import { useEffect, useState } from "react";
import type { HomeworkEvidencePage } from "../../shared/homeworkEvidence";
import { fetchHomeworkEvidence } from "./homeworkEvidenceModel";

export function useHomeworkEvidence() {
  const [page, setPage] = useState<HomeworkEvidencePage | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    void fetchHomeworkEvidence(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) {
          setPage(next);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPage(null);
          setStatus("error");
        }
      });
    return () => controller.abort();
  }, [revision]);
  return { page, status, retry: () => setRevision((value) => value + 1) };
}

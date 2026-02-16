// Prevent non-critical script errors from breaking data fetching or React bootstrapping
try {
  window.addEventListener("error", (ev) => {
    try {
      const msg = typeof ev.message === "string" ? ev.message : "Script error";
      // Only log; do not rethrow
      console.warn("[Non-blocking script error]", msg);
    } catch {
      // ignore
    }
  });
} catch {
  // ignore
}

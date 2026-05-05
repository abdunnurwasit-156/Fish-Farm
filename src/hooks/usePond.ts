// Re-exports the pond context as a hook so every existing call site (usePond())
// continues to work unchanged while the state lives in PondContext.
export { usePondContext as usePond } from "@/contexts/PondContext";

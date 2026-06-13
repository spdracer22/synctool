export interface SyncSource {
  sync(from: string, to: string): Promise<void>;
}

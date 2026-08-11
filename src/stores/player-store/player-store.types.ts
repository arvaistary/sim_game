export interface PlayerState {
  name: string
  welcomeScreenShown: boolean
  /** Staged prologue traits until full personality system is wired. */
  traits: string[]
  /** Staged life memory ids from prologue. */
  memories: string[]
}

// Event emitter for scanning filter commits
// This ensures Analytics radar chart only fetches once with stable, committed filters

type FilterCommitHandler = (filters: any) => void;

class ScanningEventEmitter {
  private handlers: FilterCommitHandler[] = [];

  on(event: 'filtersCommitted', handler: FilterCommitHandler) {
    if (event === 'filtersCommitted') {
      this.handlers.push(handler);
    }
    
    // Return unsubscribe function
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  emit(event: 'filtersCommitted', filters: any) {
    if (event === 'filtersCommitted') {
      console.log('[scanningEvents] Emitting filtersCommitted:', filters);
      this.handlers.forEach(handler => handler(filters));
    }
  }
}

export const scanningEvents = new ScanningEventEmitter();

export function parseIndianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim().toLowerCase();
  
  // Try various Indian date formats
  const patterns = [
    // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    /(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})/,
    // YYYY-MM-DD
    /(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/,
    // Month DD, YYYY (e.g., "January 15, 2024")
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i,
    // DD Month YYYY (e.g., "15 January 2024")
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
  ];

  const monthMap: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      if (match[0].includes('-') || match[0].includes('/') || match[0].includes('.')) {
        // DD-MM-YYYY format
        if (match[1].length === 4) {
          // YYYY-MM-DD
          const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          if (isValidDate(date)) return date;
        } else {
          // DD-MM-YYYY
          const date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          if (isValidDate(date)) return date;
        }
      } else {
        // Month name format
        const monthName = match[1] || match[2];
        const day = match[1] && !isNaN(parseInt(match[1])) ? parseInt(match[1]) : parseInt(match[2]);
        const year = parseInt(match[3]);
        const month = monthMap[monthName.toLowerCase()];
        
        if (month !== undefined) {
          const date = new Date(year, month, day);
          if (isValidDate(date)) return date;
        }
      }
    }
  }

  // Try native Date parsing as fallback
  try {
    const date = new Date(dateStr);
    if (isValidDate(date)) return date;
  } catch {
    // Ignore
  }

  return null;
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return `${Math.floor(diffDays / 7)} week ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return "1 month ago";
  
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function sortByDate<T extends { parsedDate?: Date }>(
  items: T[],
  descending: boolean = true
): T[] {
  return [...items].sort((a, b) => {
    if (!a.parsedDate && !b.parsedDate) return 0;
    if (!a.parsedDate) return 1;
    if (!b.parsedDate) return -1;
    
    const diff = a.parsedDate.getTime() - b.parsedDate.getTime();
    return descending ? -diff : diff;
  });
}

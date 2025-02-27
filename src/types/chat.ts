export interface RemainingQueriesProps {
  remaining: number;
}

export interface WarningBannerProps {
  title: string;
  message: string;
  type?: 'warning' | 'error' | 'info';
  className?: string;
}
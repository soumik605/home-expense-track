import { CircleCheck, CircleDashed, CircleAlert } from 'lucide-react';
import { statusTone } from '../lib/colors';

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  const Icon = tone === 'good' ? CircleCheck : tone === 'warning' ? CircleDashed : CircleAlert;
  return (
    <span className={`badge tone-${tone}`}>
      <Icon size={13} aria-hidden />
      {status}
    </span>
  );
}

import { useLanguage } from '../../../i18n/useLanguage';
import { UserRound } from 'lucide-react';
import { useState } from 'react';
import { staffAvatarTone, staffAvatarUrl, staffInitials } from './staffData';

function StaffAvatar({ user, source, className = '' }) {
  useLanguage();
  const imageSource = source || staffAvatarUrl(user?.avatarPath);
  const [failedSource, setFailedSource] = useState('');
  const imageAvailable = Boolean(imageSource) && failedSource !== imageSource;

  return <div className={`${className} avatar-tone-${staffAvatarTone(user)}`.trim()}>
    <span>{staffInitials(user?.fullName) || <UserRound size="45%" aria-hidden="true" />}</span>
    {imageAvailable && <img className="manager-avatar-image" src={imageSource} alt="" onError={() => setFailedSource(imageSource)} />}
  </div>;
}

export default StaffAvatar;

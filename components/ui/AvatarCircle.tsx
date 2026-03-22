type Props = {
    userAvatar: string
    userColor: string
    name?: string | null
    image?: string | null
    size?: number
    onClick?: () => void
  }
  
  export function AvatarCircle({ userAvatar, userColor, name, image, size = 32, onClick }: Props) {
    return (
      <div onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', background: userAvatar.startsWith('http') || userAvatar.startsWith('data') ? 'transparent' : userColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: onClick ? 'pointer' : 'default', overflow: 'hidden', flexShrink: 0 }}>
        {userAvatar
          ? userAvatar.startsWith('http') || userAvatar.startsWith('data')
            ? <img src={userAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            : <span style={{ fontSize: size * 0.56 }}>{userAvatar}</span>
          : image
            ? <img src={image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            : <span style={{ fontSize: size * 0.44, fontWeight: 700, color: '#0c0c0e' }}>{(name?.[0] ?? '?').toUpperCase()}</span>
        }
      </div>
    )
  }
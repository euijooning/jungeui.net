export default function Button({ variant = 'primary', type = 'button', className = '', children, ...props }) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: 500,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s, color 0.15s',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--ui-primary)',
      color: '#fff',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--ui-primary)',
      border: '1px solid var(--ui-primary)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--ui-text)',
      border: '1px solid var(--ui-border)',
    },
  };

  const style = { ...baseStyle, ...variants[variant] };

  return (
    <button type={type} style={style} className={className} {...props}>
      {children}
    </button>
  );
}

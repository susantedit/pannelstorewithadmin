export function Button({ children, variant = 'ghost', icon, disabled = false, ...props }) {
  return (
    <button
      className={`button button-${variant} ${disabled ? 'disabled' : ''}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="button-icon">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

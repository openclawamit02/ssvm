import React from 'react';

const StatCard = ({ icon: Icon, label, value, sub, color = 'var(--color-mustard)', bg, badge, trend }) => (
  <div className="glass card" style={{
    padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column',
    gap: '6px', background: bg || undefined, position: 'relative', overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s', cursor: 'default'
  }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: bg ? 'rgba(255,255,255,0.2)' : `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: bg ? 'white' : color }}>
        {Icon && <Icon size={20} />}
      </div>
      {badge && (
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '20px', background: badge.color || 'rgba(255,71,87,0.1)', color: badge.textColor || 'var(--color-danger)' }}>
          {badge.label}
        </span>
      )}
    </div>
    <div style={{ marginTop: '8px' }}>
      <div style={{ fontSize: '13px', color: bg ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 800, color: bg ? 'white' : color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: bg ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
    {trend !== undefined && (
      <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '12px', fontWeight: 600, color: trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
      </div>
    )}
  </div>
);

export default StatCard;

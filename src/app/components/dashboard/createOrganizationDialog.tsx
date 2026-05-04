import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Check, Zap, Building2, Sparkles } from 'lucide-react';

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, tier: string) => Promise<void>;
}

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: '₱0',
    period: 'forever',
    desc: 'Perfect for small teams getting started',
    icon: <Zap size={18} />,
    color: '#22c55e',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    features: ['Up to 3 boards', '5 team members', 'Basic analytics', 'Activity log'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₱299',
    period: 'per month',
    desc: 'For growing teams that need more power',
    icon: <Sparkles size={18} />,
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
    features: ['Unlimited boards', '25 team members', 'Advanced analytics', 'AI Assistant', 'Priority support'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₱499',
    period: 'per month',
    desc: 'For large organizations with custom needs',
    icon: <Building2 size={18} />,
    color: '#7c3aed',
    bg: '#fdf4ff',
    border: '#e9d5ff',
    features: ['Unlimited everything', 'Unlimited members', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
  },
];

export function CreateOrganizationDialog({ open, onClose, onCreate }: CreateOrganizationDialogProps) {
  const [name, setName] = useState('');
  const [tier, setTier] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'name' | 'tier'>('name');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('tier');
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await onCreate(name, tier);
      setName('');
      setTier('free');
      setStep('name');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setTier('free');
    setStep('name');
    setError('');
    onClose();
  };

  const selectedTier = tiers.find(t => t.id === tier)!;

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="cod-overlay" />
          <Dialog.Content className={`cod-content step-${step}`}>

            {/* Step indicator */}
            <div className="cod-steps">
              <div className="cod-step">
                <div className="cod-step-num" style={{ background: '#0a0a0f', color: 'white' }}>
                  {step === 'name' ? '1' : <Check size={11} />}
                </div>
                <span style={{ color: '#0a0a0f' }}>Name</span>
              </div>
              <div className="cod-step-line" />
              <div className="cod-step">
                <div className="cod-step-num" style={{ background: step === 'tier' ? '#0a0a0f' : '#f0efeb', color: step === 'tier' ? 'white' : '#9ca3af' }}>2</div>
                <span style={{ color: step === 'tier' ? '#0a0a0f' : '#9ca3af' }}>Plan</span>
              </div>
            </div>

            <div className="cod-header">
              <div>
                <Dialog.Title className="cod-title">
                  {step === 'name' ? 'Create Organization' : 'Choose a Plan'}
                </Dialog.Title>
                <p className="cod-subtitle">
                  {step === 'name' ? 'Give your workspace a name' : 'Select the right plan for your team'}
                </p>
              </div>
              <button className="cod-close" onClick={handleClose}><X size={14} /></button>
            </div>

            {step === 'name' ? (
              <form onSubmit={handleNext}>
                {error && <div className="cod-error">{error}</div>}
                <div>
                  <label className="cod-label">Organization Name</label>
                  <input
                    className="cod-input"
                    placeholder="Acme Inc."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="cod-actions">
                  <button type="button" className="cod-btn-cancel" onClick={handleClose}>Cancel</button>
                  <button type="submit" className="cod-btn-next" disabled={!name.trim()}>
                    Next: Choose Plan →
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {error && <div className="cod-error">{error}</div>}

                {/* Summary */}
                <div className="cod-summary">
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 2 }}>Creating workspace</div>
                    <div className="cod-summary-name">{name}</div>
                  </div>
                  <div className="cod-summary-tier" style={{ background: selectedTier.bg, color: selectedTier.color }}>
                    {selectedTier.icon} {selectedTier.name}
                  </div>
                </div>

                {/* Tier cards */}
                <div className="cod-tiers">
                  {tiers.map(t => (
                    <div
                      key={t.id}
                      className={`cod-tier ${tier === t.id ? 'selected' : ''}`}
                      style={tier === t.id ? { borderColor: t.color, background: t.bg } : {}}
                      onClick={() => setTier(t.id)}
                    >
                      {t.popular && <div className="cod-popular">Most Popular</div>}
                      <div className="cod-tier-header">
                        <div className="cod-tier-icon" style={{ background: tier === t.id ? t.color : '#f5f4f0', color: tier === t.id ? 'white' : '#6b6b7b' }}>
                          {t.icon}
                        </div>
                        <div className="cod-tier-check checked" style={{ background: tier === t.id ? t.color : 'transparent', borderColor: tier === t.id ? t.color : 'rgba(10,10,15,0.12)' }}>
                          {tier === t.id && <Check size={11} color="white" />}
                        </div>
                      </div>
                      <div className="cod-tier-name">{t.name}</div>
                      <div className="cod-tier-price">{t.price}</div>
                      <div className="cod-tier-period">{t.period}</div>
                      <div className="cod-tier-desc">{t.desc}</div>
                      <div className="cod-tier-features">
                        {t.features.map((f, i) => (
                          <div className="cod-tier-feature" key={i}>
                            <div className="cod-tier-feature-dot" style={{ background: t.bg }}>
                              <Check size={9} color={t.color} />
                            </div>
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cod-actions">
                  <button className="cod-back" onClick={() => setStep('name')}>← Back</button>
                  <button className="cod-create" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Creating...' : `Create with ${selectedTier.name} Plan →`}
                  </button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
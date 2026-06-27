import { useState, useEffect } from 'react';
import { Save, Building2, CreditCard, Globe } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { ImageUpload } from '../components/common/ImageUpload';
import { uploadImage } from '../lib/supabase';
import { toast } from 'sonner';

export function Settings() {
  const { settings, loading, updateSettings } = useCompanySettings();
  const [saving, setSaving] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateName, setStateName] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPublicId, setLogoPublicId] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setGstin(settings.gstin || '');
      setStateName(settings.state || '');
      setStateCode(settings.state_code || '');
      setBankName(settings.bank_name || '');
      setAccountNumber(settings.account_number || '');
      setIfscCode(settings.ifsc_code || '');
      setBranch(settings.branch || '');
      setDomain(settings.domain || '');
      setLogoUrl(settings.logo_url || '');
      setLogoPublicId(settings.logo_public_id || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalLogoUrl = logoUrl;
      let finalLogoPublicId = logoPublicId;

      if (logoFile) {
        const path = `company/logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
        const result = await uploadImage('dc-images', logoFile, path);
        finalLogoUrl = result.url;
        finalLogoPublicId = result.public_id;
      }

      await updateSettings({
        company_name: companyName,
        address,
        phone,
        gstin,
        state: stateName,
        state_code: stateCode,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        branch,
        domain,
        logo_url: finalLogoUrl,
        logo_public_id: finalLogoPublicId,
      });

      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Settings"
        subtitle="Company & billing configuration"
        actions={
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        }
      />

      <div className="p-6 max-w-4xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Company Details */}
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Company Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="form-input" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">GSTIN</label>
                <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">State</label>
                <input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">State Code</label>
                <input type="text" value={stateCode} onChange={(e) => setStateCode(e.target.value)} className="form-input" />
              </div>
              <div className="md:col-span-2">
                <ImageUpload
                  label="Company Logo"
                  value={logoUrl || undefined}
                  onChange={(file) => {
                    setLogoFile(file);
                    if (!file) setLogoUrl('');
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="glass-card p-6 animate-fade-in delay-1" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Bank Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Bank Name</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Account Number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">IFSC Code</label>
                <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Branch</label>
                <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} className="form-input" />
              </div>
            </div>
          </div>

          {/* Domain Settings */}
          <div className="glass-card p-6 animate-fade-in delay-2" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-violet-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">QR Code Domain</h3>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Domain URL</label>
              <input type="url" value={domain} onChange={(e) => setDomain(e.target.value)} className="form-input" placeholder="https://mpprints.com" />
              <p className="text-xs text-gray-400 mt-1">QR codes will use this domain: {domain}/view/INV000001</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

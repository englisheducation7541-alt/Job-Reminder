import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Edit2,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerSite } from '../../types';

export const CustomersView: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerSite,
    updateCustomerSite,
    deleteCustomerSite,
    jobs,
    currentUser,
    setSelectedJobId,
    setIsCreateJobOpen,
    openPaymentReminderModal,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Site modal state
  const [siteModalData, setSiteModalData] = useState<{
    customerId: string;
    site?: CustomerSite;
  } | null>(null);

  const [siteForm, setSiteForm] = useState({
    siteName: '',
    address: '',
    city: '',
    contactPerson: '',
    mobile: '',
    gpsLocation: '',
  });

  // New Customer Form State
  const [newCust, setNewCust] = useState({
    companyName: '',
    customerType: 'Healthcare / Hospital',
    contactPerson: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    siteName: 'Main Facility',
  });

  const canManage = ['admin', 'manager'].includes(currentUser.role);
  const isAdmin = currentUser.role === 'admin';

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q)
    );
  });

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.companyName.trim()) return;

    addCustomer({
      companyName: newCust.companyName.trim(),
      customerType: newCust.customerType,
      contactPerson: newCust.contactPerson.trim(),
      mobile: newCust.mobile.trim(),
      email: newCust.email.trim(),
      address: newCust.address.trim(),
      city: newCust.city.trim(),
      sites: [
        {
          id: `site_${Date.now()}`,
          siteName: newCust.siteName.trim() || 'Main Site',
          address: newCust.address.trim(),
          city: newCust.city.trim(),
          contactPerson: newCust.contactPerson.trim(),
          mobile: newCust.mobile.trim(),
        },
      ],
    });

    setShowAddCustomerModal(false);
    setNewCust({
      companyName: '',
      customerType: 'Healthcare / Hospital',
      contactPerson: '',
      mobile: '',
      email: '',
      address: '',
      city: '',
      siteName: 'Main Facility',
    });
  };

  const handleEditCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    updateCustomer(editingCustomer.id, {
      companyName: editingCustomer.companyName,
      customerType: editingCustomer.customerType,
      contactPerson: editingCustomer.contactPerson,
      mobile: editingCustomer.mobile,
      email: editingCustomer.email,
      address: editingCustomer.address,
      city: editingCustomer.city,
    });

    setEditingCustomer(null);
  };

  const handleOpenAddSite = (customerId: string) => {
    setSiteForm({
      siteName: '',
      address: '',
      city: '',
      contactPerson: '',
      mobile: '',
      gpsLocation: '',
    });
    setSiteModalData({ customerId });
  };

  const handleOpenEditSite = (customerId: string, site: CustomerSite) => {
    setSiteForm({
      siteName: site.siteName,
      address: site.address,
      city: site.city || '',
      contactPerson: site.contactPerson,
      mobile: site.mobile,
      gpsLocation: site.gpsLocation || '',
    });
    setSiteModalData({ customerId, site });
  };

  const handleSiteFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteModalData) return;

    if (siteModalData.site) {
      updateCustomerSite(siteModalData.customerId, siteModalData.site.id, {
        siteName: siteForm.siteName,
        address: siteForm.address,
        city: siteForm.city,
        contactPerson: siteForm.contactPerson,
        mobile: siteForm.mobile,
        gpsLocation: siteForm.gpsLocation,
      });
    } else {
      addCustomerSite(siteModalData.customerId, {
        siteName: siteForm.siteName,
        address: siteForm.address,
        city: siteForm.city,
        contactPerson: siteForm.contactPerson,
        mobile: siteForm.mobile,
        gpsLocation: siteForm.gpsLocation,
      });
    }

    setSiteModalData(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Customers &amp; Site Directory</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage multi-site enterprise clients, facility contacts, and linked maintenance job histories.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => openPaymentReminderModal()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-101"
            title="Send Client Payment Reminder via WhatsApp & Email"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>Client Payment Reminder</span>
          </button>

          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black active:scale-98 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white rounded-2xl border border-stone-200 shadow-xs p-2">
        <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by company name, city, contact person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs text-stone-900 focus:outline-none placeholder:text-stone-400"
        />
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.map((cust) => {
          const isExpanded = expandedCustomerId === cust.id;
          const custJobs = jobs.filter((j) => j.customerId === cust.id);

          return (
            <div
              key={cust.id}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs transition-all"
            >
              {/* Row Header */}
              <div
                onClick={() => setExpandedCustomerId(isExpanded ? null : cust.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-stone-900 text-sm">{cust.companyName}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700">
                        {cust.customerType}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                      <span>{cust.city}</span>
                      <span>•</span>
                      <span>Contact: {cust.contactPerson} ({cust.mobile})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
                    {cust.sites.length} {cust.sites.length === 1 ? 'Site' : 'Sites'} • {custJobs.length} Jobs
                  </span>

                  <button
                    onClick={() => openPaymentReminderModal(cust)}
                    className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title={`Send Payment Reminder to ${cust.companyName}`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Payment Reminder</span>
                    <span className="sm:hidden">Payment</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCreateJobOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    + Assign Job
                  </button>

                  {canManage && (
                    <button
                      onClick={() => setEditingCustomer(cust)}
                      className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 cursor-pointer"
                      title="Edit Customer Info"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => setCustomerToDelete(cust)}
                      className="p-1.5 rounded-lg border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 cursor-pointer"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => setExpandedCustomerId(isExpanded ? null : cust.id)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Sub-view */}
              {isExpanded && (
                <div className="p-5 border-t border-stone-100 bg-stone-50/50 space-y-4 text-xs">
                  {/* Sites grid */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold uppercase tracking-wider text-stone-400 text-[10px]">
                        Registered Facilities &amp; Plant Locations
                      </h4>
                      {canManage && (
                        <button
                          onClick={() => handleOpenAddSite(cust.id)}
                          className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Add Plant / Site</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cust.sites.map((site) => (
                        <div
                          key={site.id}
                          className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-1.5 shadow-2xs"
                        >
                          <div className="font-bold text-stone-900 flex items-center justify-between">
                            <span>{site.siteName}</span>
                            <div className="flex items-center gap-1.5">
                              {site.gpsLocation && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.gpsLocation)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 text-[11px]"
                                >
                                  <span>Map</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {canManage && (
                                <button
                                  onClick={() => handleOpenEditSite(cust.id, site)}
                                  className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                                  title="Edit Site Details"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                              {isAdmin && cust.sites.length > 1 && (
                                <button
                                  onClick={() => deleteCustomerSite(cust.id, site.id)}
                                  className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50"
                                  title="Delete Site"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-[11px] text-stone-500 flex items-start gap-1">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                            <span>{site.address}</span>
                          </div>
                          <div className="text-[11px] text-stone-600 pt-1 border-t border-stone-100 flex items-center justify-between">
                            <span>Incharge: {site.contactPerson}</span>
                            <a href={`tel:${site.mobile}`} className="text-emerald-700 font-semibold">
                              {site.mobile}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Jobs History */}
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-stone-400 text-[10px] mb-2">
                      Recent Maintenance &amp; Service Jobs
                    </h4>
                    {custJobs.length === 0 ? (
                      <div className="text-stone-400 text-center py-4 bg-white rounded-xl border border-stone-100">
                        No active jobs logged for this customer.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {custJobs.map((j) => (
                          <div
                            key={j.id}
                            onClick={() => setSelectedJobId(j.id)}
                            className="p-2.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-300 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-emerald-800 font-bold">{j.jobId}</span>
                              <span className="font-semibold text-stone-900">{j.title}</span>
                            </div>
                            <div className="flex items-center gap-3 text-stone-500">
                              <span>Due: {j.dueDate}</span>
                              <span className="capitalize font-semibold text-stone-700">{j.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base">Register New Customer</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Biotech Laboratories Ltd."
                  value={newCust.companyName}
                  onChange={(e) => setNewCust({ ...newCust, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Customer Type</label>
                  <select
                    value={newCust.customerType}
                    onChange={(e) => setNewCust({ ...newCust, customerType: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="Healthcare / Hospital">Healthcare / Hospital</option>
                    <option value="Industrial / Manufacturing">Industrial / Manufacturing</option>
                    <option value="Pharmaceutical">Pharmaceutical</option>
                    <option value="Energy & Utility">Energy &amp; Utility</option>
                    <option value="Commercial Facility">Commercial Facility</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai / Pune"
                    value={newCust.city}
                    onChange={(e) => setNewCust({ ...newCust, city: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Rajesh Nair"
                    value={newCust.contactPerson}
                    onChange={(e) => setNewCust({ ...newCust, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98200 12345"
                    value={newCust.mobile}
                    onChange={(e) => setNewCust({ ...newCust, mobile: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Office / Site Address</label>
                <input
                  type="text"
                  placeholder="Plot 44, MIDC Industrial Area..."
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base">Edit Customer Information</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.companyName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Customer Type</label>
                  <select
                    value={editingCustomer.customerType}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, customerType: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="Healthcare / Hospital">Healthcare / Hospital</option>
                    <option value="Industrial / Manufacturing">Industrial / Manufacturing</option>
                    <option value="Pharmaceutical">Pharmaceutical</option>
                    <option value="Energy & Utility">Energy &amp; Utility</option>
                    <option value="Commercial Facility">Commercial Facility</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.city}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Contact Person</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.contactPerson}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.mobile}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, mobile: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Email</label>
                <input
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Office / Site Address</label>
                <input
                  type="text"
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Site Modal */}
      {siteModalData && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base">
                {siteModalData.site ? 'Edit Facility / Plant Site' : 'Add New Facility Site'}
              </h3>
              <button
                onClick={() => setSiteModalData(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSiteFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Site / Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3 - Steam Generation Plant"
                  value={siteForm.siteName}
                  onChange={(e) => setSiteForm({ ...siteForm, siteName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thane / Navi Mumbai"
                    value={siteForm.city}
                    onChange={(e) => setSiteForm({ ...siteForm, city: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">GPS / Map Coordinates</label>
                  <input
                    type="text"
                    placeholder="e.g. 19.0760, 72.8777"
                    value={siteForm.gpsLocation}
                    onChange={(e) => setSiteForm({ ...siteForm, gpsLocation: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Site Address</label>
                <input
                  type="text"
                  placeholder="Building 4, Sector 12..."
                  value={siteForm.address}
                  onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Site Incharge Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Sanjay Varma"
                    value={siteForm.contactPerson}
                    onChange={(e) => setSiteForm({ ...siteForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Contact Mobile</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98200 98765"
                    value={siteForm.mobile}
                    onChange={(e) => setSiteForm({ ...siteForm, mobile: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSiteModalData(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  {siteModalData.site ? 'Update Site' : 'Add Facility Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-bold text-stone-900 text-base">Delete Customer?</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to permanently delete <strong>{customerToDelete.companyName}</strong> and all its registered sites?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCustomer(customerToDelete.id);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

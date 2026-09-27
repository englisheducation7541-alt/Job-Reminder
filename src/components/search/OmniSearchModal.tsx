import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, CustomerSite, Job, User as AppUser } from '../../types';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/formatters';
import { formatDateDisplay, formatStatusLabel } from '../../utils/whatsappEngine';

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

type SearchCategory = 'all' | 'jobs' | 'people' | 'locations' | 'phones';

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const {
    jobs,
    users,
    customers,
    setSelectedJobId,
    openUserProfile,
    setActiveTab,
    openSendWhatsAppModal,
  } = useApp();

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialQuery]);

  // Global keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const cleanQuery = query.trim().toLowerCase();
  const cleanDigits = query.replace(/[^0-9]/g, '');

  // 1. Search Matching Jobs
  const matchedJobs = useMemo(() => {
    if (!cleanQuery && !cleanDigits) return [];
    return jobs.filter((j) => {
      const matchId = j.jobId.toLowerCase().includes(cleanQuery);
      const matchTitle = j.title.toLowerCase().includes(cleanQuery);
      const matchDesc = (j.description || '').toLowerCase().includes(cleanQuery);
      const matchType = (j.jobType || '').toLowerCase().includes(cleanQuery);
      const matchStatus = j.status.toLowerCase().includes(cleanQuery);
      const matchPriority = j.priority.toLowerCase().includes(cleanQuery);

      // Customer & Site match inside job
      const cust = customers.find((c) => c.id === j.customerId);
      const site = cust?.sites?.find((s) => s.id === j.siteId);
      const matchCust = cust?.companyName.toLowerCase().includes(cleanQuery);
      const matchSite = site?.siteName.toLowerCase().includes(cleanQuery);
      const matchLocation = (site?.address || '').toLowerCase().includes(cleanQuery);

      // Assignee match inside job
      const assignee = users.find((u) => u.id === j.assignedToId);
      const matchAssignee = assignee?.name.toLowerCase().includes(cleanQuery);

      // Phone match
      const matchPhone =
        cleanDigits.length >= 3 &&
        ((j.contactNumber || '').replace(/[^0-9]/g, '').includes(cleanDigits) ||
          (cust?.mobile || '').replace(/[^0-9]/g, '').includes(cleanDigits) ||
          (site?.mobile || '').replace(/[^0-9]/g, '').includes(cleanDigits));

      return (
        matchId ||
        matchTitle ||
        matchDesc ||
        matchType ||
        matchStatus ||
        matchPriority ||
        matchCust ||
        matchSite ||
        matchLocation ||
        matchAssignee ||
        matchPhone
      );
    });
  }, [jobs, customers, users, cleanQuery, cleanDigits]);

  // 2. Search Matching People (Field Engineers, Managers, Customer Contacts)
  const matchedPeople = useMemo(() => {
    if (!cleanQuery && !cleanDigits) return [];
    const staffMatches = users
      .filter((u) => {
        const matchName = u.name.toLowerCase().includes(cleanQuery);
        const matchEmpId = (u.employeeId || '').toLowerCase().includes(cleanQuery);
        const matchDesig = (u.designation || '').toLowerCase().includes(cleanQuery);
        const matchDept = (u.department || '').toLowerCase().includes(cleanQuery);
        const matchEmail = (u.email || '').toLowerCase().includes(cleanQuery);
        const phone = (u.whatsapp || u.mobile || '').replace(/[^0-9]/g, '');
        const matchPhone = cleanDigits.length >= 3 && phone.includes(cleanDigits);

        return matchName || matchEmpId || matchDesig || matchDept || matchEmail || matchPhone;
      })
      .map((u) => ({ type: 'team' as const, user: u }));

    const customerContacts: { type: 'customer_contact'; customer: Customer; site?: CustomerSite; contactPerson: string; phone: string; email?: string }[] = [];
    customers.forEach((c) => {
      if (
        c.contactPerson?.toLowerCase().includes(cleanQuery) ||
        (cleanDigits.length >= 3 && (c.mobile || '').replace(/[^0-9]/g, '').includes(cleanDigits))
      ) {
        customerContacts.push({
          type: 'customer_contact',
          customer: c,
          contactPerson: c.contactPerson,
          phone: c.mobile,
          email: c.email,
        });
      }
      (c.sites || []).forEach((s) => {
        if (
          s.contactPerson?.toLowerCase().includes(cleanQuery) ||
          (cleanDigits.length >= 3 && (s.mobile || '').replace(/[^0-9]/g, '').includes(cleanDigits))
        ) {
          customerContacts.push({
            type: 'customer_contact',
            customer: c,
            site: s,
            contactPerson: s.contactPerson,
            phone: s.mobile,
          });
        }
      });
    });

    return [...staffMatches, ...customerContacts];
  }, [users, customers, cleanQuery, cleanDigits]);

  // 3. Search Matching Locations / Sites / Plants
  const matchedLocations = useMemo(() => {
    if (!cleanQuery) return [];
    const results: { customer: Customer; site?: CustomerSite; name: string; address: string; city?: string; state?: string }[] = [];

    customers.forEach((c) => {
      const matchCust = c.companyName.toLowerCase().includes(cleanQuery);
      const matchCustAddr = (c.address || '').toLowerCase().includes(cleanQuery);

      if (matchCust || matchCustAddr) {
        results.push({
          customer: c,
          name: c.companyName,
          address: c.address || 'Registered Office & Headquarters',
          city: c.city,
          state: c.state,
        });
      }

      (c.sites || []).forEach((s) => {
        const matchSiteName = s.siteName.toLowerCase().includes(cleanQuery);
        const matchSiteAddr = (s.address || '').toLowerCase().includes(cleanQuery);
        const matchSiteCity = (s.city || '').toLowerCase().includes(cleanQuery);

        if (matchSiteName || matchSiteAddr || matchSiteCity) {
          results.push({
            customer: c,
            site: s,
            name: `${s.siteName} (${c.companyName})`,
            address: s.address,
            city: s.city,
            state: s.state,
          });
        }
      });
    });

    return results;
  }, [customers, cleanQuery]);

  // 4. Contact Numbers (Dedicated phone lookup)
  const matchedPhones = useMemo(() => {
    if (cleanDigits.length < 3 && cleanQuery.length < 3) return [];
    const phoneResults: { entity: string; role: string; phone: string; type: 'engineer' | 'customer' | 'site'; rawUser?: AppUser; rawJob?: Job }[] = [];

    users.forEach((u) => {
      const p = u.whatsapp || u.mobile;
      if (p && (p.replace(/[^0-9]/g, '').includes(cleanDigits) || u.name.toLowerCase().includes(cleanQuery))) {
        phoneResults.push({
          entity: u.name,
          role: u.designation,
          phone: p,
          type: 'engineer',
          rawUser: u,
        });
      }
    });

    customers.forEach((c) => {
      if (c.mobile && (c.mobile.replace(/[^0-9]/g, '').includes(cleanDigits) || c.companyName.toLowerCase().includes(cleanQuery))) {
        phoneResults.push({
          entity: c.companyName,
          role: `Customer (${c.contactPerson})`,
          phone: c.mobile,
          type: 'customer',
        });
      }
      (c.sites || []).forEach((s) => {
        if (s.mobile && (s.mobile.replace(/[^0-9]/g, '').includes(cleanDigits) || s.siteName.toLowerCase().includes(cleanQuery))) {
          phoneResults.push({
            entity: s.siteName,
            role: `Site Contact (${s.contactPerson})`,
            phone: s.mobile,
            type: 'site',
          });
        }
      });
    });

    return phoneResults;
  }, [users, customers, cleanDigits, cleanQuery]);

  const totalResultsCount =
    matchedJobs.length + matchedPeople.length + matchedLocations.length + matchedPhones.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-16 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center gap-3 bg-stone-50/80">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by Job ID, Title, Location, Engineer, Customer, or Contact Phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm sm:text-base font-medium text-stone-900 focus:outline-none placeholder:text-stone-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-stone-200 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-semibold cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-4 py-2 bg-stone-100/70 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Results ({cleanQuery ? totalResultsCount : 0})
          </button>
          <button
            onClick={() => setActiveCategory('jobs')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeCategory === 'jobs'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Jobs ({matchedJobs.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory('people')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeCategory === 'people'
                ? 'bg-white text-blue-800 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>People &amp; Team ({matchedPeople.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory('locations')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeCategory === 'locations'
                ? 'bg-white text-amber-800 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Locations &amp; Sites ({matchedLocations.length})</span>
          </button>
          <button
            onClick={() => setActiveCategory('phones')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeCategory === 'phones'
                ? 'bg-white text-teal-800 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contact Numbers ({matchedPhones.length})</span>
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {!cleanQuery ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Universal Search Across All Pages</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Type any keyword to search across jobs, field engineers, customer plants, site locations, or mobile contact numbers.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Compressor', 'Rahul Sharma', 'Apex Hospital', 'EMP-201', 'Overdue', '+91 98765'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setQuery(chip)}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResultsCount === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-stone-800">No matching records found</h4>
              <p className="text-xs text-stone-500">
                No jobs, engineers, customer sites, or contact numbers matched &ldquo;{query}&rdquo;.
              </p>
            </div>
          ) : (
            <>
              {/* SECTION 1: JOBS */}
              {(activeCategory === 'all' || activeCategory === 'jobs') && matchedJobs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                      Job Assignments ({matchedJobs.length})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {matchedJobs.slice(0, activeCategory === 'jobs' ? 50 : 5).map((job) => {
                      const assignee = users.find((u) => u.id === job.assignedToId);
                      const customer = customers.find((c) => c.id === job.customerId);
                      const site = customer?.sites?.find((s) => s.id === job.siteId);

                      return (
                        <div
                          key={job.id}
                          onClick={() => {
                            setSelectedJobId(job.id);
                            onClose();
                          }}
                          className="p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {job.jobId}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadgeClass(job.priority)}`}>
                                {job.priority.toUpperCase()}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusBadgeClass(job.status)}`}>
                                {formatStatusLabel(job.status)}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                              {job.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3 text-stone-400" />
                                {customer?.companyName} {site ? `• ${site.siteName}` : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-stone-400" />
                                Due: {formatDateDisplay(job.dueDate)} {job.dueTime}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            {assignee && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-700">
                                <img
                                  src={assignee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                  alt={assignee.name}
                                  className="w-6 h-6 rounded-full object-cover border border-stone-200"
                                />
                                <span className="font-medium">{assignee.name}</span>
                              </div>
                            )}
                            <div className="p-1.5 rounded-lg bg-stone-50 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-stone-400 transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: PEOPLE & TEAM */}
              {(activeCategory === 'all' || activeCategory === 'people') && matchedPeople.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      People &amp; Field Staff ({matchedPeople.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {matchedPeople.slice(0, activeCategory === 'people' ? 50 : 6).map((item, idx) => {
                      if (item.type === 'team') {
                        const u = item.user;
                        return (
                          <div
                            key={`user_${u.id}_${idx}`}
                            onClick={() => {
                              openUserProfile(u);
                              onClose();
                            }}
                            className="p-3 rounded-2xl border border-stone-200 bg-white hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt={u.name}
                                className="w-9 h-9 rounded-full object-cover border border-stone-200 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-stone-900 group-hover:text-blue-600">
                                    {u.name}
                                  </h4>
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                                    {u.employeeId}
                                  </span>
                                </div>
                                <p className="text-[11px] text-stone-500">{u.designation}</p>
                                <p className="text-[10px] text-stone-400 font-mono">{u.whatsapp || u.mobile}</p>
                              </div>
                            </div>
                            <div className="text-stone-400 group-hover:text-blue-600">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        );
                      }

                      // Customer contact
                      const c = item.customer;
                      return (
                        <div
                          key={`cust_contact_${idx}`}
                          onClick={() => {
                            setActiveTab('customers');
                            onClose();
                          }}
                          className="p-3 rounded-2xl border border-stone-200 bg-white hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">
                              Customer Contact
                            </span>
                            <h4 className="text-xs font-bold text-stone-900 mt-1">{item.contactPerson}</h4>
                            <p className="text-[11px] text-stone-500">{c.companyName} {item.site ? `• ${item.site.siteName}` : ''}</p>
                            <p className="text-[10px] text-stone-400 font-mono">{item.phone}</p>
                          </div>
                          <div className="text-stone-400 group-hover:text-amber-600">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 3: LOCATIONS & SITES */}
              {(activeCategory === 'all' || activeCategory === 'locations') && matchedLocations.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      Locations, Facilities &amp; Plants ({matchedLocations.length})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {matchedLocations.slice(0, activeCategory === 'locations' ? 50 : 5).map((loc, idx) => (
                      <div
                        key={`loc_${idx}`}
                        onClick={() => {
                          setActiveTab('customers');
                          onClose();
                        }}
                        className="p-3 rounded-2xl border border-stone-200 bg-white hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-amber-600" />
                            <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-700">
                              {loc.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-stone-600">{loc.address}</p>
                          {loc.city && (
                            <p className="text-[10px] text-stone-400 font-medium">
                              {loc.city}{loc.state ? `, ${loc.state}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="text-stone-400 group-hover:text-amber-600 shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: CONTACT NUMBERS */}
              {(activeCategory === 'all' || activeCategory === 'phones') && matchedPhones.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      Contact Numbers ({matchedPhones.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedPhones.slice(0, activeCategory === 'phones' ? 50 : 6).map((ph, idx) => (
                      <div
                        key={`ph_${idx}`}
                        className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-800">
                            {ph.type}
                          </span>
                          <h4 className="text-xs font-bold text-stone-900 mt-0.5">{ph.entity}</h4>
                          <p className="text-[10px] text-stone-500">{ph.role}</p>
                          <p className="text-xs font-mono font-bold text-emerald-700 mt-1">{ph.phone}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={`tel:${ph.phone.replace(/[^0-9+]/g, '')}`}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
                            title="Call Phone"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${ph.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                            title="Open WhatsApp Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Search Footer */}
        <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 font-mono text-[10px]">Esc</kbd>
            <span>to close</span>
          </div>
          <span className="font-medium text-emerald-700">Real-time across Jobs, Customers, Sites &amp; Staff</span>
        </div>
      </div>
    </div>
  );
};

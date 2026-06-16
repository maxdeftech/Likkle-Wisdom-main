export interface EmergencyContact {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'fire' | 'clinic' | 'doctor' | 'embassy' | 'coastguard' | 'other';
  parish: string;
  address: string;
  phone: string;
  altPhone?: string;
  email?: string;
  coordinates: [number, number];
  is24hr?: boolean;
  notes?: string;
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  // ===== NATIONAL NUMBERS =====
  { id: 'nat-1', name: 'Jamaica Emergency (Police/Fire/Ambulance)', type: 'police', parish: 'National', address: 'All Jamaica', phone: '119', coordinates: [18.1096, -77.2975], is24hr: true, notes: 'Universal emergency number' },
  { id: 'nat-2', name: 'Jamaica Ambulance Service', type: 'hospital', parish: 'National', address: 'All Jamaica', phone: '110', coordinates: [18.1096, -77.2975], is24hr: true },
  { id: 'nat-3', name: 'Fire Department', type: 'fire', parish: 'National', address: 'All Jamaica', phone: '110', coordinates: [18.1096, -77.2975], is24hr: true },
  { id: 'nat-4', name: 'Jamaica Tourist Board', type: 'other', parish: 'National', address: '64 Knutsford Boulevard, Kingston', phone: '1-876-929-9200', email: 'info@visitjamaica.com', coordinates: [18.014, -76.7873], notes: 'Tourism assistance' },
  { id: 'nat-5', name: 'Jamaica Coastguard', type: 'coastguard', parish: 'National', address: 'All Jamaica', phone: '1-876-967-8031', coordinates: [18.1096, -77.2975], is24hr: true },

  // ===== KINGSTON & ST. ANDREW =====
  { id: 'kgn-1', name: 'Kingston Public Hospital', type: 'hospital', parish: 'Kingston', address: 'North St, Kingston', phone: '1-876-922-0210', coordinates: [18.0012, -76.7920], is24hr: true, notes: 'Major trauma centre' },
  { id: 'kgn-2', name: 'University Hospital of the West Indies', type: 'hospital', parish: 'St. Andrew', address: 'Mona, Kingston 7', phone: '1-876-927-1620', coordinates: [18.0180, -76.7484], is24hr: true },
  { id: 'kgn-3', name: 'Half Way Tree Police Station', type: 'police', parish: 'St. Andrew', address: 'Half Way Tree Rd', phone: '1-876-926-8184', coordinates: [18.0095, -76.786], is24hr: true },
  { id: 'kgn-4', name: 'Matilda\'s Corner Police Station', type: 'police', parish: 'Kingston', address: 'East Queen St', phone: '1-876-922-2680', coordinates: [17.9976, -76.7894], is24hr: true },
  { id: 'kgn-5', name: 'Andrews Memorial Hospital', type: 'hospital', parish: 'St. Andrew', address: '27 Hope Road, Kingston 10', phone: '1-876-926-7401', coordinates: [18.0144, -76.7755], is24hr: true },
  { id: 'kgn-6', name: 'Medical Associates Hospital', type: 'hospital', parish: 'St. Andrew', address: '18 Tangerine Place, Kingston 10', phone: '1-876-926-1400', coordinates: [18.0096, -76.7852], is24hr: true },
  { id: 'kgn-7', name: 'York Park Fire Station', type: 'fire', parish: 'Kingston', address: 'Kingston', phone: '110', coordinates: [17.9980, -76.7940], is24hr: true },

  // ===== ST. JAMES (MONTEGO BAY) =====
  { id: 'stj-1', name: 'Cornwall Regional Hospital', type: 'hospital', parish: 'St. James', address: 'Mount Salem, Montego Bay', phone: '1-876-952-5100', coordinates: [18.4707, -77.9260], is24hr: true, notes: 'Western Jamaica major hospital' },
  { id: 'stj-2', name: 'Freeport Police Station', type: 'police', parish: 'St. James', address: 'Freeport, Montego Bay', phone: '1-876-952-1557', coordinates: [18.4553, -77.9231], is24hr: true },
  { id: 'stj-3', name: 'Montego Bay Fire Station', type: 'fire', parish: 'St. James', address: 'Barnett St, Montego Bay', phone: '110', coordinates: [18.4712, -77.9210], is24hr: true },
  { id: 'stj-4', name: 'Doctors Hospital (MoBay)', type: 'hospital', parish: 'St. James', address: 'Fairfield, Montego Bay', phone: '1-876-952-1610', coordinates: [18.4680, -77.9180], is24hr: true },

  // ===== ST. ANN (OCHO RIOS) =====
  { id: 'sta-1', name: 'St. Ann\'s Bay Hospital', type: 'hospital', parish: 'St. Ann', address: 'St. Ann\'s Bay', phone: '1-876-972-2272', coordinates: [18.437, -77.046], is24hr: true },
  { id: 'sta-2', name: 'Ocho Rios Police Station', type: 'police', parish: 'St. Ann', address: 'DaCosta Drive, Ocho Rios', phone: '1-876-974-2533', coordinates: [18.4042, -77.1004], is24hr: true },

  // ===== WESTMORELAND (NEGRIL) =====
  { id: 'wml-1', name: 'Savanna-la-Mar Hospital', type: 'hospital', parish: 'Westmoreland', address: 'Savanna-la-Mar', phone: '1-876-955-2533', coordinates: [18.2145, -78.1316], is24hr: true },
  { id: 'wml-2', name: 'Negril Police Station', type: 'police', parish: 'Westmoreland', address: 'Norman Manley Blvd, Negril', phone: '1-876-957-4268', coordinates: [18.2692, -78.3484], is24hr: true },
  { id: 'wml-3', name: 'Negril Health Centre', type: 'clinic', parish: 'Westmoreland', address: 'West End Road, Negril', phone: '1-876-957-4926', coordinates: [18.2650, -78.3550] },

  // ===== PORTLAND (PORT ANTONIO) =====
  { id: 'ptl-1', name: 'Port Antonio Hospital', type: 'hospital', parish: 'Portland', address: 'Naylor\'s Hill, Port Antonio', phone: '1-876-993-2646', coordinates: [18.1772, -76.4502], is24hr: true },
  { id: 'ptl-2', name: 'Port Antonio Police Station', type: 'police', parish: 'Portland', address: 'Harbour St, Port Antonio', phone: '1-876-993-2546', coordinates: [18.1767, -76.4517], is24hr: true },

  // ===== TRELAWNY (FALMOUTH) =====
  { id: 'trl-1', name: 'Falmouth Hospital', type: 'hospital', parish: 'Trelawny', address: 'Falmouth', phone: '1-876-954-3230', coordinates: [18.4944, -77.6567], is24hr: true },
  { id: 'trl-2', name: 'Falmouth Police Station', type: 'police', parish: 'Trelawny', address: 'Market St, Falmouth', phone: '1-876-954-3222', coordinates: [18.4940, -77.6560], is24hr: true },

  // ===== ST. ELIZABETH (BLACK RIVER) =====
  { id: 'ste-1', name: 'Black River Hospital', type: 'hospital', parish: 'St. Elizabeth', address: 'Black River', phone: '1-876-965-2212', coordinates: [18.0272, -77.8489], is24hr: true },
  { id: 'ste-2', name: 'Black River Police Station', type: 'police', parish: 'St. Elizabeth', address: 'High St, Black River', phone: '1-876-965-2232', coordinates: [18.0268, -77.8485], is24hr: true },

  // ===== MANCHESTER (MANDEVILLE) =====
  { id: 'man-1', name: 'Mandeville Regional Hospital', type: 'hospital', parish: 'Manchester', address: 'Hargreaves Ave, Mandeville', phone: '1-876-962-2040', coordinates: [18.0420, -77.5049], is24hr: true },
  { id: 'man-2', name: 'Mandeville Police Station', type: 'police', parish: 'Manchester', address: 'Park Crescent, Mandeville', phone: '1-876-962-2250', coordinates: [18.0415, -77.5044], is24hr: true },

  // ===== CLARENDON (MAY PEN) =====
  { id: 'cla-1', name: 'May Pen Hospital', type: 'hospital', parish: 'Clarendon', address: 'May Pen', phone: '1-876-986-2369', coordinates: [17.9714, -77.2476], is24hr: true },
  { id: 'cla-2', name: 'May Pen Police Station', type: 'police', parish: 'Clarendon', address: 'Main St, May Pen', phone: '1-876-986-2208', coordinates: [17.9710, -77.2472], is24hr: true },

  // ===== ST. CATHERINE (SPANISH TOWN) =====
  { id: 'stc-1', name: 'Spanish Town Hospital', type: 'hospital', parish: 'St. Catherine', address: 'Burke Road, Spanish Town', phone: '1-876-984-3031', coordinates: [17.9918, -76.9562], is24hr: true },
  { id: 'stc-2', name: 'Spanish Town Police Station', type: 'police', parish: 'St. Catherine', address: 'Adelaide St, Spanish Town', phone: '1-876-984-2305', coordinates: [17.9914, -76.9558], is24hr: true },

  // ===== ST. THOMAS (MORANT BAY) =====
  { id: 'stt-1', name: 'Princess Margaret Hospital', type: 'hospital', parish: 'St. Thomas', address: 'Morant Bay', phone: '1-876-982-2304', coordinates: [17.8814, -76.3330], is24hr: true },
  { id: 'stt-2', name: 'Morant Bay Police Station', type: 'police', parish: 'St. Thomas', address: 'Queen St, Morant Bay', phone: '1-876-982-2233', coordinates: [17.8811, -76.3327], is24hr: true },

  // ===== ST. MARY (PORT MARIA) =====
  { id: 'stm-1', name: 'Port Maria Hospital', type: 'hospital', parish: 'St. Mary', address: 'Port Maria', phone: '1-876-994-2228', coordinates: [18.3708, -76.8911], is24hr: true },
  { id: 'stm-2', name: 'Port Maria Police Station', type: 'police', parish: 'St. Mary', address: 'Warner St, Port Maria', phone: '1-876-994-2224', coordinates: [18.3705, -76.8907], is24hr: true },

  // ===== HANOVER (LUCEA) =====
  { id: 'han-1', name: 'Noel Holmes Hospital', type: 'hospital', parish: 'Hanover', address: 'Lucea', phone: '1-876-956-2228', coordinates: [18.4510, -78.1728], is24hr: true },
  { id: 'han-2', name: 'Lucea Police Station', type: 'police', parish: 'Hanover', address: 'Main St, Lucea', phone: '1-876-956-2222', coordinates: [18.4506, -78.1724], is24hr: true },

  // ===== EMBASSIES & CONSULATES =====
  { id: 'emb-1', name: 'US Embassy Kingston', type: 'embassy', parish: 'Kingston', address: '142 Old Hope Road, Kingston 6', phone: '1-876-702-6000', email: 'KingstonACS@state.gov', coordinates: [18.0168, -76.7628], notes: 'American citizen services' },
  { id: 'emb-2', name: 'British High Commission', type: 'embassy', parish: 'Kingston', address: '28 Trafalgar Road, Kingston 10', phone: '1-876-510-0700', coordinates: [18.0103, -76.7826], notes: 'UK citizen services' },
  { id: 'emb-3', name: 'Canadian High Commission', type: 'embassy', parish: 'Kingston', address: '3 West Kings House Road, Kingston 10', phone: '1-876-926-1500', coordinates: [18.0158, -76.7897], notes: 'Canadian citizen services' },
  { id: 'emb-4', name: 'German Embassy', type: 'embassy', parish: 'Kingston', address: '10 Waterloo Road, Kingston 10', phone: '1-876-926-6728', coordinates: [18.0115, -76.7860] },
  { id: 'emb-5', name: 'Japanese Embassy', type: 'embassy', parish: 'Kingston', address: 'NCB Towers, 2 Oxford Road, Kingston 5', phone: '1-876-929-3338', coordinates: [18.0067, -76.7870] },
];

export const CONTACT_TYPE_META: Record<EmergencyContact['type'], { label: string; icon: string; color: string }> = {
  police:     { label: 'Police',      icon: 'local_police',          color: '#3b82f6' },
  hospital:   { label: 'Hospital',    icon: 'local_hospital',        color: '#ef4444' },
  fire:       { label: 'Fire',        icon: 'local_fire_department', color: '#f97316' },
  clinic:     { label: 'Clinic',      icon: 'medical_services',      color: '#10b981' },
  doctor:     { label: 'Doctor',      icon: 'stethoscope',           color: '#8b5cf6' },
  embassy:    { label: 'Embassy',     icon: 'account_balance',       color: '#6366f1' },
  coastguard: { label: 'Coast Guard', icon: 'sailing',               color: '#0ea5e9' },
  other:      { label: 'Other',       icon: 'info',                  color: '#64748b' },
};

export const PARISHES = [
  'National', 'Kingston', 'St. Andrew', 'St. Catherine', 'Clarendon', 'Manchester',
  'St. Elizabeth', 'Westmoreland', 'Hanover', 'St. James', 'Trelawny',
  'St. Ann', 'St. Mary', 'Portland', 'St. Thomas'
];

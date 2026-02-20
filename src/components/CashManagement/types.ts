/** Stored in DB cash_registers.closure_details when closing with full form */
export interface ClosureDetails {
    closingEspecie: number;
    closingCartao: number;
    closingDelivery: number;
    closingTotal: number;
    apuracaoNotas: number;
    apuracaoMoedas: number;
    apuracaoEspecieTotal: number;
    cartaoItems: { brand: string; value: number }[];
    deliveryItems: { app: string; value: number }[];
    extras: { description: string; value: number; type: 'entrada' | 'saida' }[];
    depositValue: number;
    depositStatus: 'deposited' | 'pending';
    attachments: { name: string; date: string }[];
    comments: string[];
    closedBy: string;
    noMovement: boolean;
}

export interface CashEntry {
    id: string;
    storeId: string;
    date: string;
    openingValue: number;
    previousClose: number;
    closingEspecie: number;
    closingCartao: number;
    closingDelivery: number;
    closingTotal: number;
    apuracaoNotas: number;
    apuracaoMoedas: number;
    apuracaoEspecieTotal: number;
    cartaoItems: { brand: string; value: number }[];
    deliveryItems: { app: string; value: number }[];
    extras: { description: string; value: number; type: 'entrada' | 'saida' }[];
    depositValue: number;
    depositStatus: 'deposited' | 'pending';
    depositDate?: string;
    depositComment?: string;
    attachments: { name: string; date: string }[];
    comments: string[];
    openedBy: string;
    closedBy: string;
    status: 'open' | 'closed';
    noMovement: boolean;
}

export interface DepositRecord {
    id: string;
    storeId: string;
    date: string;
    value: number;
    comment: string;
    hasAttachment: boolean;
    hasComment: boolean;
    relatedEntryIds: string[];
}

export interface CashSettings {
    baseValueEnabled: boolean;
    baseValue: number;
    extrasConsideredStores: string[];
}

export const DEMO_ENTRIES: CashEntry[] = [
    {
        id: '1', storeId: '1', date: '2025-02-24', openingValue: 150, previousClose: 0,
        closingEspecie: 300, closingCartao: 567, closingDelivery: 234, closingTotal: 1101,
        apuracaoNotas: 250, apuracaoMoedas: 50, apuracaoEspecieTotal: 300,
        cartaoItems: [{ brand: 'VISA', value: 300 }, { brand: 'MASTERCARD', value: 267 }],
        deliveryItems: [{ app: 'UBEREATS', value: 134 }, { app: 'GLOVO', value: 100 }],
        extras: [{ description: 'Gorjeta', value: 5, type: 'entrada' }],
        depositValue: 250, depositStatus: 'pending',
        attachments: [], comments: ['Dia movimentado'],
        openedBy: 'William Cardoso', closedBy: 'William Cardoso',
        status: 'closed', noMovement: false,
    },
    {
        id: '2', storeId: '1', date: '2025-02-23', openingValue: 150, previousClose: 0,
        closingEspecie: 195, closingCartao: 400, closingDelivery: 200, closingTotal: 795,
        apuracaoNotas: 150, apuracaoMoedas: 45, apuracaoEspecieTotal: 195,
        cartaoItems: [{ brand: 'VISA', value: 200 }, { brand: 'MULTIBANCO', value: 200 }],
        deliveryItems: [{ app: 'UBEREATS', value: 200 }],
        extras: [],
        depositValue: 183, depositStatus: 'pending',
        attachments: [], comments: [],
        openedBy: 'William Cardoso', closedBy: 'William Cardoso',
        status: 'closed', noMovement: false,
    },
    {
        id: '3', storeId: '2', date: '2025-02-22', openingValue: 200, previousClose: 0,
        closingEspecie: 250, closingCartao: 500, closingDelivery: 400, closingTotal: 1150,
        apuracaoNotas: 200, apuracaoMoedas: 50, apuracaoEspecieTotal: 250,
        cartaoItems: [{ brand: 'MASTERCARD', value: 500 }],
        deliveryItems: [{ app: 'GLOVO', value: 400 }],
        extras: [{ description: 'Troco', value: 10, type: 'saida' }],
        depositValue: 200, depositStatus: 'pending',
        attachments: [], comments: [],
        openedBy: 'William Cardoso', closedBy: 'William Cardoso',
        status: 'closed', noMovement: false,
    },
];

export const DEMO_DEPOSITS: DepositRecord[] = [
    { id: 'd1', storeId: '1', date: '2025-03-07', value: 450, comment: '', hasAttachment: false, hasComment: false, relatedEntryIds: [] },
    { id: 'd2', storeId: '1', date: '2025-02-18', value: 123, comment: 'Depósito parcial', hasAttachment: false, hasComment: true, relatedEntryIds: [] },
    { id: 'd3', storeId: '2', date: '2025-02-10', value: 234, comment: '', hasAttachment: false, hasComment: false, relatedEntryIds: [] },
    { id: 'd4', storeId: '2', date: '2025-02-11', value: 70, comment: 'Referente a sábado', hasAttachment: true, hasComment: true, relatedEntryIds: [] },
];

export const DEFAULT_CARD_BRANDS = ['VISA', 'MASTERCARD', 'MULTIBANCO', 'MB WAY', 'AMERICAN EXPRESS'];
export const DEFAULT_DELIVERY_APPS = ['UBEREATS', 'GLOVO', 'BOLT FOOD'];

export const fmt = (v: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);

/** CashRegister from DataContext (minimal type for conversion) */
export interface CashRegisterForEntry {
  id: string;
  storeId: string;
  openingBalance: number;
  closingBalance?: number;
  openedAt: Date;
  closedAt?: Date;
  openedBy: string;
  closedBy?: string;
  status: 'open' | 'closed';
  deposited?: boolean;
  closureDetails?: ClosureDetails;
}

/** Build CashEntry from a persisted cash register (list + detail view). */
export function cashRegisterToEntry(cr: CashRegisterForEntry): CashEntry {
  const dateStr = cr.openedAt instanceof Date ? cr.openedAt.toISOString().split('T')[0] : new Date(cr.openedAt).toISOString().split('T')[0];
  const closing = cr.closingBalance ?? 0;
  const d = cr.closureDetails;
  if (d) {
    return {
      id: cr.id,
      storeId: cr.storeId,
      date: dateStr,
      openingValue: cr.openingBalance,
      previousClose: 0,
      closingEspecie: d.closingEspecie ?? 0,
      closingCartao: d.closingCartao ?? 0,
      closingDelivery: d.closingDelivery ?? 0,
      closingTotal: d.closingTotal ?? closing,
      apuracaoNotas: d.apuracaoNotas ?? 0,
      apuracaoMoedas: d.apuracaoMoedas ?? 0,
      apuracaoEspecieTotal: d.apuracaoEspecieTotal ?? (d.closingEspecie ?? 0),
      cartaoItems: d.cartaoItems ?? [],
      deliveryItems: d.deliveryItems ?? [],
      extras: d.extras ?? [],
      depositValue: d.depositValue ?? 0,
      depositStatus: d.depositStatus ?? 'pending',
      attachments: d.attachments ?? [],
      comments: d.comments ?? [],
      openedBy: cr.openedBy,
      closedBy: d.closedBy ?? cr.closedBy ?? '',
      status: cr.status,
      noMovement: !!d.noMovement,
    };
  }
  return {
    id: cr.id,
    storeId: cr.storeId,
    date: dateStr,
    openingValue: cr.openingBalance,
    previousClose: 0,
    closingEspecie: closing,
    closingCartao: 0,
    closingDelivery: 0,
    closingTotal: closing,
    apuracaoNotas: 0,
    apuracaoMoedas: 0,
    apuracaoEspecieTotal: closing,
    cartaoItems: [],
    deliveryItems: [],
    extras: [],
    depositValue: 0,
    depositStatus: cr.deposited ? 'deposited' : 'pending',
    attachments: [],
    comments: [],
    openedBy: cr.openedBy,
    closedBy: cr.closedBy ?? '',
    status: cr.status,
    noMovement: false,
  };
}

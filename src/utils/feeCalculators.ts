import { PricingFormData } from '../types';
import axios from 'axios';
import { referralFees, weightHandlingFees, closingFees, otherFees } from '../data/fees';

export const calculateReferralFee = (category: string, price: number): number => {
  let feeStructure;
  
  if (category.startsWith('Automotive')) {
    if (category.includes('Helmets')) {
      feeStructure = referralFees.automotive.helmetsAndGloves;
    } else if (category.includes('Tyres')) {
      feeStructure = referralFees.automotive.tyresAndRims;
    } else if (category.includes('Vehicles')) {
      return price * (referralFees.automotive.vehicles.percentage / 100);
    }
  } else if (category.startsWith('Baby')) {
    feeStructure = referralFees.baby.hardlines;
  } else if (category === 'Books') {
    feeStructure = referralFees.books;
  }

  if (!feeStructure) return price * 0.15; // Default rate

  for (const tier of feeStructure) {
    if (('maxPrice' in tier && price <= tier.maxPrice) || 
        ('minPrice' in tier && price > tier.minPrice)) {
      return price * (tier.percentage / 100);
    }
  }

  return price * 0.15; // Default fallback
};

export const calculateWeightHandlingFee = (
  mode: string,
  weight: number,
  serviceLevel: string,
  location: string,
  size: string
): number => {
  if (mode === 'Easy Ship') {
    const fees = weightHandlingFees.easyShip;
    const sizeFees = size === 'Standard' ? fees.standard : fees.heavyBulky;

    if (size === 'Standard') {
      if (weight <= 0.5) {
        return sizeFees.first500g[location.toLowerCase()];
      } else if (weight <= 1) {
        return sizeFees.first500g[location.toLowerCase()] + 
               sizeFees.additional500gUpTo1kg[location.toLowerCase()];
      } else if (weight <= 5) {
        return sizeFees.first500g[location.toLowerCase()] +
               sizeFees.additional500gUpTo1kg[location.toLowerCase()] +
               (Math.ceil(weight - 1) * sizeFees.additionalKgAfter1kg[location.toLowerCase()]);
      } else {
        return sizeFees.first500g[location.toLowerCase()] +
               sizeFees.additional500gUpTo1kg[location.toLowerCase()] +
               (4 * sizeFees.additionalKgAfter1kg[location.toLowerCase()]) +
               (Math.ceil(weight - 5) * sizeFees.additionalKgAfter5kg[location.toLowerCase()]);
      }
    } else {
      if (weight <= 12) {
        return sizeFees.first12kg[location.toLowerCase()];
      } else {
        return sizeFees.first12kg[location.toLowerCase()] +
               (Math.ceil(weight - 12) * sizeFees.additionalKgAfter12kg[location.toLowerCase()]);
      }
    }
  }

  if (mode === 'FBA') {
    const fees = weightHandlingFees.fba.standard[serviceLevel.toLowerCase()];
    if (weight <= 0.5) return fees.first500g;
    if (weight <= 1) return fees.first500g + fees.additional500gUpTo1kg;
    if (weight <= 5) {
      return fees.first500g + fees.additional500gUpTo1kg +
             (Math.ceil(weight - 1) * fees.additionalKgAfter1kg);
    }
    return fees.first500g + fees.additional500gUpTo1kg +
           (4 * fees.additionalKgAfter1kg) +
           (Math.ceil(weight - 5) * fees.additionalKgAfter5kg);
  }

  return 0;
};

export const calculateClosingFee = (mode: string, price: number): number => {
  const getFeeRange = (price: number) => {
    if (price <= 250) return 'upTo250';
    if (price <= 500) return 'upTo500';
    if (price <= 1000) return 'upTo1000';
    return 'above1000';
  };

  const range = getFeeRange(price);

  if (mode === 'FBA') {
    return closingFees.fba.normal[range];
  } else if (mode === 'Easy Ship') {
    return closingFees.easyShip.standard[range];
  } else if (mode === 'Self Ship') {
    return closingFees.selfShip[range];
  }

  return 0;
};

export const calculatePickAndPackFee = (mode: string, size: string): number => {
  if (mode !== 'FBA') return 0;
  return size === 'Standard' ? otherFees.pickAndPack.standard : otherFees.pickAndPack.oversizeHeavyBulky;
};

export const calculateTotalFees = async (data: PricingFormData) => {
  
  const totalFee=await axios.post('http://localhost:3000/api/v1/profitability-calculator',data)

  const {breakdown,totalFees,netEarnings}=totalFee.data
  const referralFee=breakdown.referralFee
  const closingFee=breakdown.closingFee
  const pickAndPackFee=breakdown.otherFee
  const weightHandlingFee=0;
  return {
    referralFee,
    weightHandlingFee,
    closingFee,
    pickAndPackFee,
    totalFees,
    netEarnings
  };
};
import React from 'react'

interface PricingDisplayProps {
  product: {
    price?: string
    details?: {
      mrp?: string
      websitePrice?: string
    }
  }
  csvProduct?: {
    'MRP (₹)'?: string
    'MRP '?: string
    'MRP'?: string
    'website price'?: string
    'Website Price'?: string
  }
  className?: string
  showDiscount?: boolean
  inline?: boolean // New prop to control whether to use inline elements
}

export function PricingDisplay({ 
  product, 
  csvProduct, 
  className = '', 
  showDiscount = true,
  inline = false
}: PricingDisplayProps) {
  // Priority: Admin panel data > CSV data > fallback
  const adminMrp = product?.details?.mrp
  const adminWebsitePrice = product?.details?.websitePrice
  const csvMrp = csvProduct?.['MRP (₹)'] || csvProduct?.['MRP '] || csvProduct?.['MRP']
  const csvWebsitePrice = csvProduct?.['website price'] || csvProduct?.['Website Price']
  
  const mrp = adminMrp || csvMrp || product.price || '₹599'
  const websitePrice = adminWebsitePrice || csvWebsitePrice || ''
  
  // Clean price values for calculations
  const cleanMrp = parseFloat(mrp.toString().replace(/[₹,]/g, '')) || 0
  const cleanWebsitePrice = parseFloat(websitePrice.toString().replace(/[₹,]/g, '')) || 0
  
  // Show discounted pricing if we have both MRP and website price and they're different
  const hasDiscount = websitePrice && websitePrice !== mrp && cleanWebsitePrice < cleanMrp && cleanWebsitePrice > 0
  
  if (hasDiscount && showDiscount) {
    const discountPercent = Math.round(((cleanMrp - cleanWebsitePrice) / cleanMrp) * 100)
    
    if (inline) {
      return (
        <span className={`flex flex-col ${className}`}>
          <span className="text-gray-500 line-through text-sm">₹{cleanMrp.toLocaleString()}</span>
          <span className="text-xl font-bold text-green-600">₹{cleanWebsitePrice.toLocaleString()}</span>
          {discountPercent > 0 && (
            <span className="text-xs text-green-500">
              {discountPercent}% OFF
            </span>
          )}
        </span>
      )
    }
    
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="text-gray-500 line-through text-sm">₹{cleanMrp.toLocaleString()}</div>
        <span className="text-xl font-bold text-green-600">₹{cleanWebsitePrice.toLocaleString()}</span>
        {discountPercent > 0 && (
          <div className="text-xs text-green-500">
            {discountPercent}% OFF
          </div>
        )}
      </div>
    )
  }
  
  // Fallback to regular pricing
  return (
    <span className={`text-lg font-medium ${className}`} style={{color: '#1B4965'}}>
      ₹{cleanMrp.toLocaleString()}
    </span>
  )
}

export default PricingDisplay

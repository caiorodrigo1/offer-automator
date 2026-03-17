export interface ShopeeProduct {
  itemId: string;
  productName: string;
  imageUrl: string;
  priceCents: number;
  originalPriceCents: number;
  discountPercent: number;
  salesCount: number;
  rating: number;
  shopName: string;
  affiliateLink: string;
  commissionRate: number;
}

export interface ShopeeProductOfferNode {
  itemId: number;
  productName: string;
  imageUrl: string;
  priceMin: number;
  priceMax: number;
  priceDiscountRate: number;
  sales: number;
  ratingStar: number;
  shopId: number;
  shopName: string;
  shopType: string;
  productLink: string;
  commissionRate: number;
  sellerCommissionRate: number;
  shopeeCommissionRate: number;
  commission: number;
  offerLink: string;
  periodStartTime: number;
  periodEndTime: number;
}

export interface ShopeeProductOfferResponse {
  data: {
    productOfferV2: {
      nodes: ShopeeProductOfferNode[];
      pageInfo: {
        page: number;
        limit: number;
        hasNextPage: boolean;
      };
    };
  };
}

export interface ShopeeApiError {
  errCode: number;
  errMsg: string;
}

export const PRODUCT_OFFER_V2_QUERY = `
  query GetProductOffers($page: Int!, $limit: Int!, $sortType: Int!) {
    productOfferV2(
      listType: 0
      sortType: $sortType
      page: $page
      limit: $limit
    ) {
      nodes {
        itemId
        productName
        imageUrl
        priceMin
        priceMax
        priceDiscountRate
        sales
        ratingStar
        shopId
        shopName
        shopType
        productLink
        commissionRate
        sellerCommissionRate
        shopeeCommissionRate
        commission
        offerLink
        periodStartTime
        periodEndTime
      }
      pageInfo {
        page
        limit
        hasNextPage
      }
    }
  }
`;

import type { Order, Payment, Profile } from "@/types";
import { call } from "./http";
import { createOrder, getState, MockError } from "@/mocks/store";

export const orderService = {
  list(profile: Profile): Promise<Order[]> {
    return call("orders/list", { method: "POST", body: JSON.stringify({ profile }) }, () => {
      const { orders } = getState();
      if (profile.role === "buyer") return orders.filter((o) => o.buyerId === profile.id);
      if (profile.role === "farmer") return orders.filter((o) => o.farmerId === profile.id);
      if (profile.role === "admin") return orders;
      return orders.filter((o) => o.buyerId === profile.id || o.farmerId === profile.id);
    });
  },

  get(id: string): Promise<Order> {
    return call(`orders/get?id=${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ id }) }, () => {
      const o = getState().orders.find((x) => x.id === id);
      if (!o) throw new MockError("Order not found", "NOT_FOUND");
      return o;
    });
  },

  create(input: {
    listingId: string;
    buyer: Profile;
    quantityKg: number;
    payment: Payment;
  }): Promise<Order> {
    return call("orders/create", { method: "POST", body: JSON.stringify(input) }, () => {
      const listing = getState().listings.find((l) => l.id === input.listingId);
      if (!listing) throw new MockError("Listing not found", "NOT_FOUND");
      if (input.quantityKg <= 0) throw new MockError("Choose a quantity first.", "VALIDATION");
      if (input.quantityKg > listing.quantityKg) {
        throw new MockError("That is more than the farmer has available.", "VALIDATION");
      }
      return createOrder({ listing, buyer: input.buyer, quantityKg: input.quantityKg, payment: input.payment });
    }, { mutation: true });
  },
};

import CartContent from "@/components/CartContent";
import { getCart } from "@/lib/actions/cart";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your items and proceed to checkout",
};

export default async function CartPage() {
  // Preload cart data on server side for better initial load
  const cartData = await getCart();

  return <CartContent initialCart={cartData} />;
}
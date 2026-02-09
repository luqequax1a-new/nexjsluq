"use client";

import Link from "next/link";

export function CheckoutSteps() {
  return (
    <div className="steps-wrap">
      <div className="container mx-auto px-4">
        <ul className="step-tabs list-none">
          <li className="step-tab">
            <Link href="/sepet" className="step-tab-text">
              Sepet
              <span className="bg-text">01</span>
            </Link>
          </li>
          <li className="step-tab active">
            <span className="step-tab-text">
              Ödeme
              <span className="bg-text">02</span>
            </span>
          </li>
          <li className="step-tab">
            <span className="step-tab-text">
              Tamamlandı
              <span className="bg-text">03</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

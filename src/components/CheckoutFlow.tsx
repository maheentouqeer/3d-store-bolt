import { useStore, TAX_RATE } from '../lib/store'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

type PayMethod = 'card' | 'cash' | 'wallet'
type CheckoutStep = 'pay' | 'processing' | 'receipt'

export function CheckoutFlow() {
  const cart = useStore((s) => s.cart)
  const checkoutActive = useStore((s) => s.checkoutActive)
  const setCheckoutActive = useStore((s) => s.setCheckoutActive)
  const clearCart = useStore((s) => s.clearCart)

  const [method, setMethod] = useState<PayMethod>('card')
  const [step, setStep] = useState<CheckoutStep>('pay')
  const [cardNum, setCardNum] = useState('')
  const [cardExp, setCardExp] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [orderNumber, setOrderNumber] = useState('')

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.qty, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax

  if (!checkoutActive) return null

  const handlePay = async () => {
    setStep('processing')
    // Save order to database
    const orderNum = 'OMG-' + Date.now().toString().slice(-8)
    setOrderNumber(orderNum)
    
    try {
      const { data: orderData } = await supabase.from('orders').insert({
        order_number: orderNum,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'completed',
        payment_method: method,
      }).select().single()

      if (orderData) {
        const items = cart.map((c) => ({
          order_id: orderData.id,
          product_id: c.product.id,
          product_name: c.product.name,
          price: c.product.price,
          qty: c.qty,
        }))
        await supabase.from('order_items').insert(items)
      }
    } catch (e) {
      // Order save fails silently — checkout is simulated
    }

    setTimeout(() => setStep('receipt'), 2200)
  }

  const handleContinue = () => {
    clearCart()
    setCheckoutActive(false)
    setStep('pay')
    setMethod('card')
    setCardNum('')
    setCardExp('')
    setCardCvc('')
    setOrderNumber('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 fade-in p-4">
      <div className="bg-ink rounded-lg shadow-2xl border border-white/10 w-full max-w-md overflow-hidden slide-up">
        {step === 'pay' && (
          <div className="p-6">
            <h2 className="font-sign font-bold text-paper text-2xl mb-1">Checkout</h2>
            <p className="text-paper/50 text-sm mb-6">Lane 1 — Simulated payment</p>

            {/* Items summary */}
            <div className="space-y-1.5 mb-4 max-h-32 overflow-y-auto scrollbar-thin">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm text-paper/70">
                  <span className="truncate flex-1">{item.qty}× {item.product.name}</span>
                  <span className="font-mono ml-2">${(item.product.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-3 space-y-1.5 mb-6">
              <div className="flex justify-between text-paper/60 text-sm">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-paper/60 text-sm">
                <span>Tax (8%)</span>
                <span className="font-mono">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-paper font-bold text-lg">
                <span>Total</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['card', 'cash', 'wallet'] as PayMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`h-11 rounded-lg text-sm font-medium transition-all focus-ring capitalize ${
                    method === m ? 'bg-deep text-paper' : 'bg-white/10 text-paper/70 hover:bg-white/20'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Card form */}
            {method === 'card' && (
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={cardNum}
                  onChange={(e) => setCardNum(e.target.value)}
                  placeholder="Card number"
                  maxLength={19}
                  className="w-full h-11 px-3 rounded-lg bg-white/10 text-paper text-sm outline-none focus-ring border border-white/10 placeholder:text-paper/40 font-mono"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="h-11 px-3 rounded-lg bg-white/10 text-paper text-sm outline-none focus-ring border border-white/10 placeholder:text-paper/40 font-mono"
                  />
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="CVC"
                    maxLength={4}
                    className="h-11 px-3 rounded-lg bg-white/10 text-paper text-sm outline-none focus-ring border border-white/10 placeholder:text-paper/40 font-mono"
                  />
                </div>
              </div>
            )}

            {method === 'cash' && (
              <div className="mb-4 p-4 rounded-lg bg-white/5 text-paper/60 text-sm text-center">
                Please pay ${total.toFixed(2)} at the register
              </div>
            )}

            {method === 'wallet' && (
              <div className="mb-4 p-4 rounded-lg bg-white/5 text-paper/60 text-sm text-center">
                Tap your device to pay ${total.toFixed(2)}
              </div>
            )}

            <button
              onClick={handlePay}
              className="w-full h-12 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500 transition-colors focus-ring"
            >
              Pay ${total.toFixed(2)}
            </button>
            <button
              onClick={() => setCheckoutActive(false)}
              className="w-full py-2 text-paper/40 hover:text-paper text-xs transition-colors mt-2"
            >
              Back to shopping
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-6">
              <div className="w-full h-full border-4 border-white/10 border-t-deep rounded-full animate-spin" />
            </div>
            <h2 className="font-sign font-bold text-paper text-xl mb-2">Processing payment...</h2>
            <p className="text-paper/50 text-sm">Please wait</p>
          </div>
        )}

        {step === 'receipt' && (
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-600/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-sign font-bold text-paper text-2xl mb-1">Payment Complete</h2>
            <p className="text-paper/50 text-sm mb-6">Thank you for shopping at Omega</p>

            <div className="bg-white/5 rounded-lg p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-paper/50">Order number</span>
                <span className="font-mono text-paper">{orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-paper/50">Items</span>
                <span className="font-mono text-paper">{cart.reduce((s, c) => s + c.qty, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-paper/50">Total paid</span>
                <span className="font-mono text-paper">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-paper/50">Payment</span>
                <span className="text-paper capitalize">{method}</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full h-12 rounded-lg bg-deep text-paper font-medium hover:bg-deep/80 transition-colors focus-ring"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    )
  }

  const faqs = [
    {
      question: "What makes NEFOL AESTHETICS products unique?",
      answer: "NEFOL AESTHETICS products are crafted with a unique blend of nature that contain Clitoria Ternatea flower extract also known as BlueTea (Aprajita). Nefol products are clinically proven, safe, and effective components. Our formulations are carefully developed to deliver effective results, addressing specific skincare concerns while promoting overall skin health. Our products fulfil all international compliance to provide the best product to our customer. Nefol products basically combine modern technology with natural ingredients to give the best products to society."
    },
    {
      question: "Are NEFOL AESTHETICS products suitable for all skin types?",
      answer: "Yes, NEFOL AESTHETICS products are designed to be suitable for all skin types including acne-prone skin. Each product is formulated to provide optimal benefits for your skin concern while being gentle on the skin. AHA and BHA components used in Nefol products enhance the skin."
    },
    {
      question: "How do I determine which NEFOL AESTHETICS product is right for me?",
      answer: "We recommended considering your specific skincare concerns and goals. Our product descriptions provide details about their benefits and recommended usage. Additionally, you can consult skincare experts for personalised recommendations."
    },
    {
      question: "Can I use NEFOL AESTHETICS products if I have sensitive skin?",
      answer: "Yes, most of our products are formulated with gentle components like triethanolamine to accommodate sensitive skin. However, it's always recommended to perform a patch test before incorporating new products into your routine to ensure compatibility and to consult with a dermatologist if you have specific sensitivities."
    },
    {
      question: "Are NEFOL AESTHETICS products tested on animals?",
      answer: "No, we are committed to being a cruelty-free brand. NEFOL AESTHETICS does not conduct any testing on animals, and our products are certified cruelty-free."
    },
    {
      question: "How often should I use NEFOL AESTHETICS products for best results?",
      answer: "The frequency of the product used depends on the specific product and its instructions. Generally, following the recommended usage guidelines on the product packaging or as advised by our skincare experts will help you achieve the best results."
    },
    {
      question: "Can NEFOL AESTHETICS products be used in combination with other skincare brands?",
      answer: "We do not have the safety study for other brands. However, it's essential to ensure compatibility and patch-test with other brands. We recommend integrating one product at a time to observe how your skin responds and adjust accordingly."
    },
    {
      question: "What are the key components used in NEFOL AESTHETICS products?",
      answer: "Nefol skincare products feature a range of thoughtfully selected components such as Blue Tea, Charcoal, hylocereus undatus fruit extract, hyaluronic acid, and purified water, phenoxyethanol and ethylhexylglycerin. Each product description provides detailed information about its benefits."
    },
    {
      question: "Are NEFOL AESTHETICS products free from harmful chemicals and parabens?",
      answer: "Yes, we prioritise formulating our products without harmful chemicals like parabens, sulphates, mineral oil, and artificial fragrances. We aim to deliver safe and effective skincare solutions that promote skin health."
    },
    {
      question: "How long does it take to see results from using NEFOL AESTHETICS products?",
      answer: "Results may vary depending on individual factors and the specific product used. In general, it is recommended to use our products consistently and as directed for several weeks to observe visible improvements in your skin. Remember, skincare is a journey, and patience is key."
    },
    {
      question: "Where can I purchase NEFOL AESTHETICS products?",
      answer: "NEFOL AESTHETICS products are available for purchase on our official website (www.nefol.in). We ensure a secure and convenient online shopping experience for our customers."
    },
    {
      question: "What is the shipping policy for NEFOL AESTHETICS orders?",
      answer: "We offer various shipping options depending on your location. Shipping details, including estimated delivery times and costs, are provided during the checkout process. We strive to process orders promptly and ensure timely delivery."
    },
    {
      question: "Can I track the status of my NEFOL AESTHETICS order?",
      answer: "Yes, once your order is confirmed and shipped, you will receive a tracking number via email/ WhatsApp. You can use the tracking number to monitor the progress of your shipment and stay updated on its estimated delivery date."
    }
  ]

  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Find answers to common questions about Nefol products, usage, and policies.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-16">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 pr-4">
                  {faq.question}
                </h3>
                {openItems.includes(index) ? (
                  <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
              </button>
              
              {openItems.includes(index) && (
                <div className="px-6 pb-4">
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Still Have Questions?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Can't find the answer you're looking for? Our customer support team is here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#/contact" 
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
            <a 
              href="tel:+918887847213" 
              className="inline-block border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              Call Us: +91-8887-847213
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
import React from 'react'
import { Quote, Heart, Users, Award, Target } from 'lucide-react'

export default function ChairpersonMessage() {
  return (
    <main className="py-10 dark:bg-slate-900 min-h-screen">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Message from Our Chairperson
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            A personal message from our leadership team
          </p>
        </div>

        {/* Chairperson Profile */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-1">
              <div className="w-48 h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto flex items-center justify-center">
                <span className="text-white text-4xl font-bold">NG</span>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Neha Gupta
              </h2>
              <p className="text-xl text-blue-600 dark:text-blue-400 mb-4">
                Chairperson, Nefol
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                A passionate leader dedicated to revolutionizing natural skincare and empowering 
                individuals to embrace their inner and outer beauty harmoniously with Nefol.
              </p>
            </div>
          </div>
        </div>

        {/* Main Message */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-8 mb-12">
          <div className="text-center mb-8">
            <Quote className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              A Message from the Heart
            </h3>
          </div>
          
          <div className="prose prose-lg max-w-none text-slate-600 dark:text-slate-400">
            <p className="text-lg leading-relaxed mb-6">
              Working towards self reliance I want to strive to achieve high quality skincare and hair care products. 
              It's about inspiring and prompting you to embrace your inner and outer beauty to shine harmoniously with NEFOL.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              All our products are formulated to provide well being or comfort, such as a calmer spirit or clearer mind. 
              And for truly holistic care, we offer curated well being self care routine or self love ritual. 
              Our research is an ongoing learning journey with you every step of the way.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              I believe that the Earth provides us with everything we need to nourish and rejuvenate our self. 
              It's about recognizing the incredible power of nature. The collection of our products carefully formulated 
              and are a testament to the belief carefully crafted to enhance your beauty while respecting the planet we all call home.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              True beauty comes from within, enhanced by skincare as a self care ritual, not just a routine. 
              Each application is an opportunity to appreciate and love the unique beauty that makes you, you. 
              I understand the demands of modern life therefore we come through a combination of modern technique with natural ingredients.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              In hustle of daily life, we often forget to put ourselves first. Remember, your health and well being are paramount.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              We are dedicated to harnessing the natural power of butterfly pea flower (Blue Tea) to create innovative, 
              sustainable skincare & haircare products. Our quest is to deliver safe, effective solutions that enhance 
              your beauty while prioritizing environmental responsibility.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              With rigorous scientific research and a commitment to quality, we seek to redefine personal care standards. 
              Thank you for trusting us to nurture your skin and hair with nature's finest.
            </p>
            
            <div className="text-right mt-8">
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Thanks & Regards
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                Neha Gupta
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Chairperson, NEFOL
              </p>
            </div>
          </div>
        </div>

        {/* Vision & Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Our Vision</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              To achieve high quality skincare and hair care products while inspiring individuals to embrace 
              their inner and outer beauty harmoniously with Nefol's natural solutions.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Our Mission</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              To harness the natural power of butterfly pea flower (Blue Tea) to create innovative, 
              sustainable skincare & haircare products that enhance beauty while prioritizing environmental responsibility.
            </p>
          </div>
        </div>

        {/* Key Principles */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 text-center">
            Our Core Principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Self Care</h4>
              <p className="text-slate-600 dark:text-slate-400">Skincare as a self care ritual, not just a routine</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Holistic Care</h4>
              <p className="text-slate-600 dark:text-slate-400">Curated well being self care routine</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Quality</h4>
              <p className="text-slate-600 dark:text-slate-400">Rigorous scientific research and commitment to quality</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-xl mb-8 opacity-90">
            Be part of the natural skincare revolution. Experience products crafted with love, 
            backed by science, and inspired by nature.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#/shop" 
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Explore Products
            </a>
            <a 
              href="#/about" 
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Learn More About Us
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
import { useState } from 'react'
import Logo from '../components/Logo'

const ingredients = [
  {
    id: 'blue-tea',
    name: 'Blue Tea (Aprajita)',
    image: '/IMAGES/blue pea.png',
    description: `Known by various names across India — Blue Tea, Blue Pea, Aprajita (in Hindi), or Shankhpushpi in Ayurvedic tradition — this vibrant flower is more than just visually striking. Rich in powerful antioxidants such as anthocyanins, flavonoids, and polyphenols, Blue Tea is celebrated for its skin-brightening, anti-inflammatory, and soothing properties.

**Antioxidant Protection & Skin Radiance**
Blue Tea is particularly rich in anthocyanins, compounds that help neutralize free radicals and protect the skin from oxidative stress caused by UV exposure and environmental pollution. This not only prevents premature aging but also revives dull, tired-looking skin, promoting a naturally radiant and even-toned complexion.

**Anti-Inflammatory and Calming Effects**
Traditionally used in Ayurveda to calm the nervous system, Blue Tea also offers soothing benefits for the skin. Its bioactive compounds help reduce inflammation, making it effective for calming redness, irritation, and sensitivity.

**Skin Tone Improvement and Detoxification**
The flower's detoxifying properties assist in purifying the skin from within, helping to eliminate toxins and reduce the appearance of blemishes and uneven skin tone. With regular use, it helps reveal a healthier, more luminous complexion.

**Supports Collagen and Elasticity**
Thanks to its antioxidant profile, Blue Tea helps maintain skin structure by protecting collagen and elastin from breakdown. This promotes firmer, more resilient skin over time.`
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    image: '/IMAGES/charcoal.png',
    description: `Charcoal, especially in its activated form, is a skincare powerhouse known for its deep-cleansing and purifying properties. With its naturally porous structure and vast surface area, charcoal acts like a magnet for dirt, oil, and impurities, drawing them out from deep within the pores.

**Detoxifies and Purifies**
Charcoal binds to toxins, pollutants, and excess sebum, effectively decongesting clogged pores and helping prevent breakouts. It's especially beneficial for oily or acne-prone skin, leaving it feeling clean, balanced, and refreshed.

**Controls Oil and Prevents Acne**
By absorbing excess oil produced by the skin, charcoal helps balance sebum levels, making it ideal for those struggling with shine or acne. Its ability to reduce bacteria on the skin further supports a clearer, healthier complexion.

**Gentle Exfoliation**
The mild gritty texture of charcoal provides natural exfoliation, helping to lift away dead skin cells and improve skin texture. This reveals smoother, brighter skin without stripping it of its natural moisture.

**Soothes and Calms**
Though known for its detox powers, charcoal also has calming effects. It may help reduce inflammation and irritation by removing surface irritants, making it suitable even for sensitive or blemish-prone skin.`
  },
  {
    id: 'yuja',
    name: 'Yuja (Citron)',
    image: '/IMAGES/Yuja.png',
    description: `Bursting with vitamin C and natural antioxidants, Yuja is a citrus fruit revered in traditional Eastern remedies and modern skincare alike. Known for its brightening and protective qualities, Yuja helps bring out your skin's natural glow while defending it from daily environmental stressors.

**Brightens and Evens Skin Tone**
Rich in ascorbic acid (vitamin C), Yuja helps neutralize free radicals and protect skin cells from oxidative damage caused by UV rays and pollution. It also helps fade hyperpigmentation, dark spots, and uneven skin tone by inhibiting tyrosinase, the enzyme responsible for melanin production—leading to a more radiant, luminous complexion.

**Powerful Antioxidant Defense**
Yuja's high concentration of vitamin C and flavonoids provides robust antioxidant protection, helping to neutralize harmful free radicals that contribute to premature aging. This helps maintain skin's youthful appearance and vitality.

**Collagen Synthesis Support**
Vitamin C is essential for collagen production, the protein that keeps skin firm and elastic. Regular use of Yuja-infused products can help improve skin texture and reduce the appearance of fine lines and wrinkles.

**Natural Skin Renewal**
The fruit's natural acids gently exfoliate the skin, promoting cell turnover and revealing fresher, brighter skin underneath. This helps improve overall skin texture and radiance.`
  },
  {
    id: 'papaya',
    name: 'Papaya',
    image: '/IMAGES/papaya.png',
    description: `Papaya is a tropical fruit powerhouse packed with enzymes, vitamins, and antioxidants that work wonders for the skin. Rich in papain (a natural enzyme), vitamin C, and beta-carotene, papaya offers gentle exfoliation, brightening, and anti-aging benefits.

**Natural Enzyme Exfoliation**
Papain, the key enzyme in papaya, gently breaks down dead skin cells and protein debris on the skin's surface. This natural exfoliation is much gentler than harsh scrubs, making it suitable for sensitive skin while effectively revealing smoother, brighter skin.

**Skin Brightening and Tone Improvement**
Papaya's high vitamin C content helps inhibit melanin production, reducing dark spots and hyperpigmentation. It also contains alpha-hydroxy acids (AHAs) that promote cell turnover, leading to a more even skin tone and radiant complexion.

**Anti-Aging and Antioxidant Protection**
Rich in antioxidants like beta-carotene and vitamin C, papaya helps protect the skin from free radical damage caused by UV exposure and environmental pollutants. This helps prevent premature aging and maintains skin's youthful appearance.

**Hydration and Nourishment**
Papaya contains natural moisturizing properties and essential vitamins that help keep the skin hydrated and nourished. Its gentle nature makes it suitable for all skin types, including sensitive skin.`
  },
  {
    id: 'shea-butter',
    name: 'Shea Butter',
    image: '/IMAGES/shea butter.png',
    description: `Shea butter is a luxurious, nutrient-rich fat extracted from the nuts of the African shea tree. Revered for its exceptional moisturizing and healing properties, it's been used for centuries in traditional African skincare and has become a staple in modern beauty formulations.

**Deep Moisturization and Hydration**
Shea butter is rich in fatty acids and vitamins that provide intense hydration to the skin. Its emollient properties help lock in moisture, leaving the skin feeling soft, supple, and well-nourished throughout the day.

**Natural Healing and Repair**
Containing vitamins A and E, shea butter supports the skin's natural healing process. It helps repair damaged skin cells and promotes the regeneration of healthy tissue, making it beneficial for dry, cracked, or irritated skin.

**Anti-Inflammatory and Soothing**
Shea butter has natural anti-inflammatory properties that help calm irritated or sensitive skin. It's particularly effective for conditions like eczema, dermatitis, and other inflammatory skin issues.

**Protection Against Environmental Damage**
Rich in antioxidants, shea butter helps protect the skin from environmental stressors like pollution and UV damage. It forms a natural barrier that helps maintain skin health and prevents moisture loss.`
  },
  {
    id: 'coconut-oil',
    name: 'Coconut Oil',
    image: '/IMAGES/coconut oil.png',
    description: `Coconut oil is a versatile, natural ingredient that has been used in traditional skincare for centuries. Rich in medium-chain fatty acids and lauric acid, it offers excellent moisturizing, antimicrobial, and protective properties for both skin and hair.

**Intensive Moisturization**
Coconut oil's unique fatty acid composition allows it to penetrate deeply into the skin, providing long-lasting hydration. It helps restore the skin's natural moisture barrier and prevents water loss, keeping the skin soft and supple.

**Antimicrobial and Antibacterial Properties**
Lauric acid, which makes up about 50% of coconut oil's fatty acids, has strong antimicrobial properties. This helps protect the skin from harmful bacteria and may help prevent acne and other bacterial skin infections.

**Natural Anti-Aging Benefits**
Rich in antioxidants, coconut oil helps protect the skin from free radical damage that contributes to premature aging. It also contains vitamin E, which supports skin health and helps maintain a youthful appearance.

**Gentle and Versatile**
Coconut oil is gentle enough for sensitive skin and can be used for various skincare needs, from moisturizing to makeup removal. Its natural composition makes it suitable for all skin types when used appropriately.`
  }
]

export default function Ingredients() {
  const [selectedIngredient, setSelectedIngredient] = useState(ingredients[0])

  return (
    <main className="min-h-screen py-10" style={{backgroundColor: '#F4F9F9'}}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif mb-4" style={{color: '#1B4965'}}>INGREDIENTS</h1>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{color: '#9DB4C0'}}>
            Discover the powerful natural ingredients that make our products effective and gentle on your skin.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-serif mb-6" style={{color: '#1B4965'}}>Our Ingredients</h2>
              <div className="space-y-4">
                {ingredients.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    onClick={() => setSelectedIngredient(ingredient)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-300 ${
                      selectedIngredient.id === ingredient.id 
                        ? 'shadow-md' 
                        : 'hover:shadow-sm'
                    }`}
                    style={{
                      backgroundColor: selectedIngredient.id === ingredient.id ? '#D0E8F2' : '#F4F9F9',
                      color: '#1B4965'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={ingredient.image} 
                        alt={ingredient.name}
                        className="w-12 h-12 object-contain rounded"
                      />
                      <div>
                        <h3 className="font-medium">{ingredient.name}</h3>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Ingredient Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <img 
                    src={selectedIngredient.image} 
                    alt={selectedIngredient.name}
                    className="w-20 h-20 object-contain rounded"
                  />
                  <div>
                    <h2 className="text-3xl font-serif" style={{color: '#1B4965'}}>
                      {selectedIngredient.name}
                    </h2>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <div 
                    className="text-base font-light leading-relaxed whitespace-pre-line"
                    style={{color: '#9DB4C0'}}
                    dangerouslySetInnerHTML={{
                      __html: selectedIngredient.description.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1B4965;">$1</strong>')
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4" style={{color: '#1B4965'}}>Why Natural Ingredients?</h2>
            <p className="text-lg font-light max-w-2xl mx-auto" style={{color: '#9DB4C0'}}>
              Our commitment to natural, plant-based ingredients ensures gentle yet effective skincare solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{backgroundColor: '#D0E8F2'}}>
                <span className="text-2xl">🌿</span>
              </div>
              <h3 className="text-lg font-medium mb-2" style={{color: '#1B4965'}}>100% Natural</h3>
              <p className="text-sm font-light" style={{color: '#9DB4C0'}}>
                Pure plant-based ingredients without harmful chemicals
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{backgroundColor: '#D0E8F2'}}>
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-medium mb-2" style={{color: '#1B4965'}}>Gentle & Safe</h3>
              <p className="text-sm font-light" style={{color: '#9DB4C0'}}>
                Suitable for all skin types, including sensitive skin
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{backgroundColor: '#D0E8F2'}}>
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="text-lg font-medium mb-2" style={{color: '#1B4965'}}>Scientifically Proven</h3>
              <p className="text-sm font-light" style={{color: '#9DB4C0'}}>
                Backed by research and traditional knowledge
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{backgroundColor: '#D0E8F2'}}>
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-lg font-medium mb-2" style={{color: '#1B4965'}}>Eco-Friendly</h3>
              <p className="text-sm font-light" style={{color: '#9DB4C0'}}>
                Sustainable sourcing and environmentally conscious
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
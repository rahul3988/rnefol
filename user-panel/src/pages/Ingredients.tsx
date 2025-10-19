import { useState, useEffect } from 'react'
import Logo from '../components/Logo'

// Text Overlay Component with Sky Rocket Animation and Ingredient Name Display
interface TextOverlayProps {
  text: string
  isVisible: boolean
  onAnimationEnd: () => void
  onClose: () => void
}

function TextOverlay({ text, isVisible, onAnimationEnd, onClose }: TextOverlayProps) {
  useEffect(() => {
    if (isVisible) {
      // Auto close after 10 seconds
      const autoCloseTimer = setTimeout(() => {
        onClose()
      }, 10000)
      
      return () => clearTimeout(autoCloseTimer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
    >
      {/* Detailed Ingredient Information Display */}
      <div className="pointer-events-auto w-full h-full overflow-auto relative">
        <div 
          className="text-overlay text-black rounded-lg shadow-2xl transform animate-fadeIn p-8 max-w-4xl mx-auto relative"
          style={{
            backgroundColor: '#ffffff',
            animation: 'fadeInScale 0.5s ease-out forwards',
            maxHeight: '80vh',
            overflowY: 'auto',
            marginTop: '2rem',
            marginBottom: '2rem'
          }}
        >
          <div 
            className="text-sm leading-relaxed whitespace-pre-line font-bold pr-12"
            dangerouslySetInnerHTML={{
              __html: text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #000000; font-size: 1.2em; font-weight: bold;">$1</strong>')
            }}
          />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold transition-colors duration-200 z-20 cursor-pointer"
            style={{ pointerEvents: 'auto' }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

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
Thanks to its antioxidant profile, Blue Tea helps maintain skin structure by protecting collagen and elastin from breakdown. This promotes firmer, more resilient skin over time.`,
    detailedInfo: `**BLUE TEA (APRAJITA) - COMPREHENSIVE DETAILED INFORMATION**

**SCIENTIFIC CLASSIFICATION & ORIGIN**
Blue Tea, scientifically known as Clitoria ternatea, belongs to the Fabaceae family and is native to tropical and subtropical regions of Asia, including India, Thailand, and Malaysia. The plant is a perennial herbaceous vine that produces striking blue flowers, earning it names like Butterfly Pea, Blue Pea, and Aprajita in Hindi. In Ayurvedic tradition, it's revered as Shankhpushpi, meaning "conch shell flower" due to its unique shape.

**BOTANICAL CHARACTERISTICS**
The plant grows as a climbing vine reaching heights of 3-6 meters, with compound leaves arranged alternately along the stem. The flowers are the most distinctive feature - they're bright blue to purple in color, measuring 3-4 cm in diameter, with a characteristic butterfly-like shape. The plant produces flat, elongated seed pods containing 6-10 seeds each. The root system is extensive and forms symbiotic relationships with nitrogen-fixing bacteria, making it beneficial for soil health.

**CHEMICAL COMPOSITION & ACTIVE COMPOUNDS**
Blue Tea contains a rich array of bioactive compounds that contribute to its therapeutic properties:

**Anthocyanins**: The primary pigments responsible for the blue color, including ternatin A-D, delphinidin, and cyanidin derivatives. These compounds exhibit strong antioxidant activity, with studies showing they can scavenge free radicals more effectively than vitamin C.

**Flavonoids**: Quercetin, kaempferol, and rutin are present in significant amounts, contributing to anti-inflammatory and anti-allergic properties.

**Polyphenols**: Catechins, epicatechins, and gallic acid provide additional antioxidant benefits and support cardiovascular health.

**Triterpenoids**: Oleanolic acid and ursolic acid contribute to anti-inflammatory and hepatoprotective effects.

**Alkaloids**: Including tryptophan derivatives that may support cognitive function and mood regulation.

**Amino Acids**: All essential amino acids are present, making it a complete protein source.

**Vitamins & Minerals**: Rich in vitamin C, vitamin E, iron, calcium, magnesium, and zinc.

**TRADITIONAL USES & CULTURAL SIGNIFICANCE**
In traditional medicine systems across Asia, Blue Tea has been used for centuries:

**Ayurvedic Medicine**: Classified as a "Medhya" herb (brain tonic), used to enhance memory, concentration, and cognitive function. It's also considered "Varnya" (skin beautifying) and "Rasayana" (rejuvenating).

**Traditional Chinese Medicine**: Used to support kidney and liver function, improve circulation, and enhance vitality.

**Thai Traditional Medicine**: Employed as a natural food coloring and for its cooling properties.

**Malaysian Folk Medicine**: Used to treat anxiety, depression, and sleep disorders.

**MODERN SCIENTIFIC RESEARCH & STUDIES**
Recent scientific studies have validated many traditional uses:

**Cognitive Enhancement**: Research published in the Journal of Ethnopharmacology (2018) demonstrated that Blue Tea extract improved memory consolidation and spatial learning in animal models. The study attributed these effects to increased acetylcholine levels and neuroprotective properties.

**Antioxidant Activity**: A 2019 study in Food Chemistry showed that Blue Tea anthocyanins have higher antioxidant capacity than blueberries and blackberries, with ORAC values exceeding 20,000 μmol TE/g.

**Anti-Inflammatory Properties**: Research in the Journal of Medicinal Food (2020) found that Blue Tea extract significantly reduced inflammatory markers like TNF-α and IL-6, making it potentially beneficial for inflammatory skin conditions.

**Cardiovascular Benefits**: Studies indicate that regular consumption may help reduce blood pressure and improve endothelial function due to its nitric oxide-boosting properties.

**DERMATOLOGICAL BENEFITS & SKINCARE APPLICATIONS**
Blue Tea offers numerous benefits for skin health:

**Anti-Aging Properties**: The high concentration of anthocyanins helps protect against photoaging by neutralizing UV-induced free radicals. Clinical studies show it can reduce fine lines and improve skin elasticity.

**Skin Brightening**: Natural tyrosinase inhibition helps reduce melanin production, leading to more even skin tone and reduced hyperpigmentation.

**Anti-Inflammatory Effects**: Soothes irritated skin, reduces redness, and helps calm inflammatory conditions like acne and rosacea.

**Moisture Retention**: Polysaccharides in the extract help maintain skin hydration and improve barrier function.

**Collagen Protection**: Antioxidants help prevent collagen breakdown caused by environmental stressors.

**ANTI-MICROBIAL & ANTIBACTERIAL PROPERTIES**
Research has shown that Blue Tea extract exhibits broad-spectrum antimicrobial activity against various bacteria and fungi, including:
- Staphylococcus aureus (including MRSA strains)
- Escherichia coli
- Candida albicans
- Propionibacterium acnes

This makes it particularly beneficial for acne-prone skin and as a natural preservative in cosmetic formulations.

**METABOLIC & ENDOCRINE BENEFITS**
Studies suggest that Blue Tea may help:
- Regulate blood sugar levels by improving insulin sensitivity
- Support weight management through appetite regulation
- Enhance liver function and detoxification processes
- Improve lipid metabolism and reduce cholesterol levels

**NEUROPROTECTIVE & COGNITIVE BENEFITS**
The plant's neuroprotective properties include:
- Enhancement of acetylcholine synthesis and release
- Protection against oxidative stress in brain cells
- Improvement in memory consolidation and retrieval
- Potential benefits for age-related cognitive decline

**SAFETY PROFILE & CONTRAINDICATIONS**
Blue Tea is generally considered safe for most individuals, but certain precautions should be noted:

**Pregnancy & Lactation**: Limited research available; consult healthcare provider before use.

**Blood Sugar Medications**: May enhance effects of diabetes medications; monitor blood sugar levels.

**Blood Pressure Medications**: May potentiate hypotensive effects; monitor blood pressure.

**Allergic Reactions**: Rare cases of contact dermatitis reported in sensitive individuals.

**RECOMMENDED USAGE & DOSAGE**
For skincare applications:
- Topical concentrations: 1-5% in formulations
- Daily use is generally safe
- Patch testing recommended for sensitive skin

For internal consumption:
- Tea preparation: 1-2 teaspoons dried flowers per cup
- Extract supplements: Follow manufacturer's guidelines
- Maximum safe dose not established; moderate consumption recommended

**SUSTAINABILITY & ENVIRONMENTAL IMPACT**
Blue Tea cultivation offers several environmental benefits:
- Nitrogen fixation improves soil fertility
- Drought-resistant properties reduce water requirements
- Natural pest resistance minimizes pesticide needs
- Supports biodiversity by attracting beneficial insects

**QUALITY ASSESSMENT & STANDARDIZATION**
When selecting Blue Tea products, consider:
- Color intensity (deeper blue indicates higher anthocyanin content)
- Organic certification for purity
- Extraction method (water-based extractions preserve more nutrients)
- Storage conditions (light and heat can degrade active compounds)

**FUTURE RESEARCH DIRECTIONS**
Ongoing research is exploring:
- Potential anti-cancer properties
- Applications in neurodegenerative disease prevention
- Enhanced extraction methods for maximum bioactivity
- Synergistic effects with other botanical ingredients

**CONCLUSION**
Blue Tea (Aprajita) represents a remarkable convergence of traditional wisdom and modern science. Its rich phytochemical profile, combined with centuries of traditional use and growing scientific validation, makes it an exceptional ingredient for both internal health and external beauty applications. As research continues to uncover its full potential, Blue Tea stands as a testament to nature's ability to provide powerful, multifaceted solutions for human health and wellness.`
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
    image: '/IMAGES/papaya.jpg',
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
    image: '/IMAGES/coconut-oil.jpg',
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
  const [overlayText, setOverlayText] = useState('')
  const [showOverlay, setShowOverlay] = useState(false)

  const handleImageClick = (ingredientName: string) => {
    const ingredient = ingredients.find(ing => ing.name === ingredientName)
    setOverlayText(ingredient?.detailedInfo || ingredient?.description || ingredientName)
    setShowOverlay(true)
  }

  const handleOverlayAnimationEnd = () => {
    // Animation ended, but don't close yet - ingredient name will show
  }

  const handleOverlayClose = () => {
    setShowOverlay(false)
    setOverlayText('')
  }

  return (
    <>
      <TextOverlay 
        text={overlayText} 
        isVisible={showOverlay} 
        onAnimationEnd={handleOverlayAnimationEnd}
        onClose={handleOverlayClose}
      />
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
              <div className="space-y-2">
                {ingredients.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    onClick={() => setSelectedIngredient(ingredient)}
                    className={`w-full transition-all duration-300 ${
                      selectedIngredient.id === ingredient.id 
                        ? 'shadow-md' 
                        : 'hover:shadow-sm'
                    }`}
                    style={{
                      backgroundColor: selectedIngredient.id === ingredient.id ? '#D0E8F2' : '#F4F9F9',
                      color: '#1B4965',
                      padding: '0',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    <img 
                      src={ingredient.image} 
                      alt={ingredient.name}
                      className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                      style={{
                        width: '100%',
                        height: '200px',
                        display: 'block'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleImageClick(ingredient.name)
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Ingredient Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Full-size Image */}
              <div className="w-full">
                <img 
                  src={selectedIngredient.image} 
                  alt={selectedIngredient.name}
                  className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                  style={{
                    width: '100%',
                    height: '400px',
                    display: 'block'
                  }}
                  onClick={() => handleImageClick(selectedIngredient.name)}
                />
              </div>
              
              {/* Content below image */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-4xl font-serif" style={{color: '#1B4965'}}>
                    {selectedIngredient.name}
                  </h2>
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
    </>
  )
}
export const homeFaqs = [
	{
		question: "What causes cracks in basement walls and foundations?",
		answer: "Most foundation cracks in New England are caused by water pressure (hydrostatic pressure) pushing against basement walls, freeze-thaw cycles that expand and contract the soil, and normal concrete curing and settling over time. Horizontal cracks often signal serious lateral pressure, while vertical and diagonal cracks are usually from shrinkage or settlement. Either way, any crack that's leaking water or growing wider should be inspected — small cracks become big problems fast."
	},
	{
		question: "How does foundation crack repair work?",
		answer: `We fix foundation cracks using <a href="/services/foundation-crack-injection" class="text-aac-blue hover:underline font-semibold">high-pressure injection</a> of epoxy or polyurethane resin directly into the crack, sealing it from the inside out. The process takes about 30–60 minutes per crack with no excavation required. The injected resin fills the entire crack — from the interior surface through to the outside soil — creating a permanent, waterproof bond. Every repair comes with our lifetime transferable guarantee.`
	},
	{
		question: "How much does foundation crack repair cost?",
		answer: `Foundation crack repair typically costs between $800 and $1,200 per crack, depending on the length, location, and severity. That's significantly less than exterior excavation methods, which can run $3,000–$10,000+. <a href="/services/free-foundation-consultations" class="text-aac-blue hover:underline font-semibold">Text us photos</a> for a free assessment with a written quote — no obligation, no pressure — just honest expert advice.`
	},
	{
		question: "Do you offer free foundation inspections?",
		answer: `Yes — every <a href="/services/free-foundation-consultations" class="text-aac-blue hover:underline font-semibold">foundation assessment</a> is 100% free with no obligation. Text us photos of your cracks and one of our experts will review them, explain exactly what's happening, and give you an honest recommendation. Most issues can be diagnosed from photos alone. In-person consultations are also available in Massachusetts.`
	},
	{
		question: "What areas do you serve?",
		answer: `We serve homeowners across <a href="/locations" class="text-aac-blue hover:underline font-semibold">New England</a> — Connecticut, Massachusetts, Rhode Island, New Hampshire, and Maine — including Hartford, New Haven, Springfield, Worcester, and Greater Boston. With 20+ years of experience in New England, we understand the unique foundation challenges that our climate, soil conditions, and older housing stock create.`
	},
	{
		question: "Is it cement or concrete — does it matter for my repair?",
		answer: `People often say "cement" when they mean "concrete" — and that's perfectly fine. Cement is actually just one ingredient in concrete (along with sand, gravel, and water). Your foundation is made of concrete, but regardless of what you call it, the repair process is the same: we inject structural resin directly into the crack to seal and strengthen it permanently. The fix works on poured concrete foundations, block walls, and stone foundations throughout New England.`
	}
];

export const getFaqSchema = (faqs: typeof homeFaqs) => ({
	"@type": "FAQPage",
	"mainEntity": faqs.map(faq => ({
		"@type": "Question",
		"name": faq.question,
		"acceptedAnswer": {
			"@type": "Answer",
			"text": faq.answer.replace(/<[^>]*>/g, '')
		}
	}))
});

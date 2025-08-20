# Knowledge Base for RAG (Retrieval-Augmented Generation)

This directory contains the knowledge files that will be used by the RAG system to answer business-related questions.

## File Structure

Place your RAG knowledge files here. The system expects structured data that can be used to answer business questions about:

- Business hours
- Menu items and prices
- Policies (refund, dog-friendly, etc.)
- Contact information
- Location and directions
- Services (delivery, takeout, etc.)
- Amenities (wifi, parking, seating, etc.)

## File Format

**YAML is the preferred format** for structured business data as it's the industry standard for RAG systems.

You can also use:

- Markdown files with business information
- Text files with Q&A pairs
- JSON files (if needed for specific use cases)

## Example Structure

```
knowledge/
├── cellar-sc/
│   ├── business-info.yaml
│   ├── policies.yaml
│   └── faq.yaml
├── other-business/
│   └── ...
└── shared/
    └── common-policies.yaml
```

## YAML Benefits

- **Human-readable**: Easy to edit and review
- **Industry standard**: Widely used in RAG systems
- **Structured**: Clear hierarchy and relationships
- **Comments**: Can include explanatory notes
- **Validation**: Easy to validate with schemas

## Business ID Mapping

The router uses business IDs (like "cellar-sc") to determine which knowledge files to search. Make sure your file structure matches the business IDs used in your application.

## Example YAML Structure

```yaml
business_id: cellar-sc
name: The Cellar
type: restaurant

hours:
  monday: 4:00 PM - 10:00 PM
  tuesday: 4:00 PM - 10:00 PM

amenities:
  wifi: true
  dog_friendly: true

policies:
  refund: No refunds on food items
  dog_policy: Well-behaved dogs welcome on patio
```

#!/usr/bin/env python3
"""
Build the comprehensive GSC Shared Report Diagnosis from:
1. Mass URL inspection results (sitemap URLs)
2. Noindex/canonical plans
3. Previous GSC diagnosis
4. API inspection of priority pages
"""
import json, os, time
from pathlib import Path

OUTPUT_DIR = '/home/admin1/qfinhub/.optimizer-data/gsc-shared-exports'

def load_json(path):
    with open(path) as f:
        return json.load(f)

def classify_url(url, inspection, noindex_urls, canonical_urls, sitemap_set):
    """Classify a URL into A/B/C/D categories."""
    path = url.replace('https://www.qfinhub.com', '')
    coverage = inspection.get('coverage', '?')
    
    # Identify page type
    if '/decision/' in url:
        page_type = 'decision'
    elif '/widgets/' in url:
        page_type = 'widget'
    elif '/calculators/' in url and '/geo/' not in url:
        page_type = 'calculator'  # includes tools variants under /calculators/
    elif '/tools/' in url:
        page_type = 'tool'
    elif '/blog/' in url:
        page_type = 'blog'
    elif '/compare/' in url:
        page_type = 'compare'
    elif '/guides/' in url:
        page_type = 'guide'
    elif '/scenario/' in url:
        page_type = 'scenario'
    elif '/geo/' in url or path.startswith('/calculators/') and any(city in path for city in ['nashville', 'reno', 'philadelphia']):
        page_type = 'geo'
    elif url.rstrip('/') == 'https://www.qfinhub.com':
        page_type = 'homepage'
    else:
        page_type = 'static'
    
    # Classification logic
    if coverage == 'Submitted and indexed':
        classification = 'A: Indexed'
        action = 'monitor'
    elif coverage == 'URL is unknown to Google':
        # In sitemap but unknown = needs crawl
        classification = 'A: Important - unknown to Google'
        action = 'request_indexing'
    elif coverage == 'Discovered - currently not indexed':
        if url in noindex_urls:
            classification = 'B: Cleanup lag - noindexed'
            action = 'no_action'
        elif url in canonical_urls:
            classification = 'C: Correct canonical behavior'
            action = 'no_action'
        elif page_type in ('calculator', 'blog', 'guide', 'compare', 'decision', 'widget', 'homepage', 'static'):
            classification = 'A: Important - awaiting crawl'
            action = 'improve_internal_links'
        else:
            classification = 'B: Cleanup lag'
            action = 'no_action'
    elif 'noindex' in coverage.lower():
        classification = 'B: Cleanup lag - noindexed'
        action = 'no_action'
    elif 'redirect' in coverage.lower():
        classification = 'C: Correct redirect'
        action = 'no_action'
    elif 'canonical' in coverage.lower():
        classification = 'C: Correct canonical'
        action = 'no_action'
    elif '404' in coverage or 'not found' in coverage.lower():
        classification = 'D: Technical error - 404'
        action = 'investigate_404'
    elif 'crawled' in coverage.lower() and 'not indexed' in coverage.lower():
        classification = 'D: Crawled but not indexed'
        action = 'improve_content'
    else:
        classification = f'D: Unknown - {coverage}'
        action = 'investigate'
    
    return {
        'url': url,
        'path': path,
        'page_type': page_type,
        'coverage': coverage,
        'verdict': inspection.get('verdict', '?'),
        'last_crawl': inspection.get('last_crawl'),
        'classification': classification,
        'recommended_action': action,
        'in_sitemap': url in sitemap_set,
    }

def main():
    print("Loading data files...")
    
    # Load all data
    inspections = load_json(f'{OUTPUT_DIR}/sitemap-url-inspections.json')
    noindex_plan = load_json('/home/admin1/qfinhub/.optimizer-data/noindex-plan.json')
    canonical_plan = load_json('/home/admin1/qfinhub/.optimizer-data/canonical-plan.json')
    priority = load_json(f'{OUTPUT_DIR}/priority-url-inspection.json')
    local_inv = load_json(f'{OUTPUT_DIR}/local-inventory.json')
    
    # Build lookup sets
    noindex_urls = set(c['url'] for c in noindex_plan.get('candidates', []))
    canonical_urls = set(c['url'] for c in canonical_plan.get('candidates', []))
    sitemap_set = set(local_inv['all_urls'])
    
    # Classify every sitemap URL
    print(f"Classifying {len(inspections['results'])} URLs...")
    classified = []
    
    by_coverage = {}
    by_classification = {}
    by_type = {}
    
    for url, insp in inspections['results'].items():
        if 'error' in insp:
            continue
        entry = classify_url(url, insp, noindex_urls, canonical_urls, sitemap_set)
        classified.append(entry)
        
        cov = insp.get('coverage', '?')
        by_coverage[cov] = by_coverage.get(cov, 0) + 1
        
        cls = entry['classification'].split(':')[0]
        by_classification[cls] = by_classification.get(cls, 0) + 1
        
        pt = entry['page_type']
        by_type[pt] = by_type.get(pt, 0) + 1
    
    # Coverage summary
    print("\n=== COVERAGE STATE DISTRIBUTION ===")
    for cov, count in sorted(by_coverage.items(), key=lambda x: -x[1]):
        print(f"  {cov}: {count}")
    
    # Classification summary
    print("\n=== CLASSIFICATION SUMMARY ===")
    for cls, count in sorted(by_classification.items()):
        print(f"  {cls}: {count}")
    
    # Page type summary
    print("\n=== PAGE TYPE DISTRIBUTION ===")
    for pt, count in sorted(by_type.items(), key=lambda x: -x[1]):
        print(f"  {pt}: {count}")
    
    # Urgent action items
    print("\n=== URGENT ACTION ITEMS ===")
    urgent = [c for c in classified if 'request_indexing' in c['recommended_action'] 
              or 'improve_content' in c['recommended_action']
              or 'investigate_404' in c['recommended_action']]
    for u in urgent:
        print(f"  [{u['page_type']}] {u['path']}: {u['coverage']} → {u['recommended_action']}")
    
    # Build the final report
    report = {
        'report': 'Phase 12.12 — GSC Shared Report URL Extraction + Diagnosis',
        'generated': time.strftime('%Y-%m-%d %H:%M:%S'),
        'data_sources': {
            'sitemap_urls_inspected': inspections['total'],
            'inspections_successful': inspections['success'],
            'inspections_failed': inspections['errors'],
            'noindex_plan_candidates': len(noindex_urls),
            'canonical_plan_candidates': len(canonical_urls),
            'priority_inspections': 'decision pages, core calculators, widget, homepage',
        },
        'limitations': [
            'GSC shared reports require Google login — could not extract exact URL lists from web UI',
            'Mass URL inspection covers only sitemap URLs (651), not all known URLs (4,000+)',
            'Discovered-not-indexed (1,990) includes URLs NOT in sitemap — these are reconstructed from local plans',
            '16 "excluded by noindex" pages are inferred from noindex-plan.json',
            '33 "alternate canonical" pages are inferred from canonical-plan.json',
            '5 "404" and 5 "crawled-not-indexed" are approximate — exact URLs not extractable without GSC web UI',
        ],
        'coverage_distribution': by_coverage,
        'classification_counts': by_classification,
        'page_type_distribution': by_type,
        'indexed_pages': {
            'count': by_coverage.get('Submitted and indexed', 0),
            'breakdown_by_type': {pt: sum(1 for c in classified if c['page_type'] == pt and c['coverage'] == 'Submitted and indexed')
                                 for pt in by_type},
        },
        'discovered_not_indexed': {
            'count': by_coverage.get('Discovered - currently not indexed', 0),
            'important_awaiting_crawl': [c for c in classified if 'Important - awaiting crawl' in c['classification']],
            'cleanup_lag': [c for c in classified if 'Cleanup lag' in c['classification']],
        },
        'unknown_to_google': {
            'count': by_coverage.get('URL is unknown to Google', 0),
            'urls': [c for c in classified if c['coverage'] == 'URL is unknown to Google'],
        },
        'priority_pages': {
            'core_calculators': priority.get('core_calculators', {}),
            'decision_pages': priority.get('decision_pages', {}),
            'widget': priority.get('widget', {}),
            'homepage': priority.get('homepage', {}),
        },
        'urgent_action_items': [{
            'url': u['url'],
            'path': u['path'],
            'page_type': u['page_type'],
            'coverage': u['coverage'],
            'action': u['recommended_action'],
        } for u in urgent],
        'all_classified_urls': classified,
    }
    
    # Save the report
    report_path = f'{OUTPUT_DIR}/gsc-shared-diagnosis-report.json'
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\nSaved diagnosis report: {report_path}")
    
    # Build action plan draft
    action_plan = {
        'report': 'Phase 12.12 — GSC Shared Action Plan Draft',
        'generated': time.strftime('%Y-%m-%d %H:%M:%S'),
        'status': 'DRAFT — DO NOT EXECUTE',
        'warning': 'This plan is a DRAFT for review. No actions should be taken until approved by Qasem.',
        'actions': {
            'no_action_cleanup_lag': len([c for c in classified if 'no_action' in c['recommended_action'] and 'Cleanup lag' in c['classification']]),
            'no_action_correct_canonical': len([c for c in classified if 'no_action' in c['recommended_action'] and 'Correct' in c['classification']]),
            'request_indexing_candidates': [c for c in classified if 'request_indexing' in c['recommended_action']],
            'improve_internal_links_candidates': [c for c in classified if 'improve_internal_links' in c['recommended_action']],
            'improve_content_candidates': [c for c in classified if 'improve_content' in c['recommended_action']],
            'investigate_404_candidates': [c for c in classified if 'investigate_404' in c['recommended_action']],
        },
        'safety': {
            'no_fixes_executed': True,
            'no_pages_noindexed': True,
            'no_pages_canonicalized': True,
            'no_pages_redirected': True,
            'no_pages_deleted': True,
            'no_indexing_api_used': True,
            'no_risky_automations_reenabled': True,
            'report_is_diagnosis_only': True,
        }
    }
    
    action_path = f'{OUTPUT_DIR}/gsc-shared-action-plan-draft.json'
    with open(action_path, 'w') as f:
        json.dump(action_plan, f, indent=2)
    print(f"Saved action plan draft: {action_path}")

if __name__ == '__main__':
    main()

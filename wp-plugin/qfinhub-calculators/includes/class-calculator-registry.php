<?php
/**
 * Calculator registry.
 *
 * Calculator definitions live in assets/data/calculators.json so the same
 * metadata drives the shortcode UI, the block, and the JS renderer. The maths
 * lives in JS (assets/js/qfinhub-calculators.js) keyed by calculator id — a JSON
 * expression evaluator would mean eval() on the front end, which we do not ship.
 *
 * A calculator only appears in the UI when BOTH the JSON entry and a matching JS
 * compute function exist. That keeps a half-migrated library from showing a
 * calculator that cannot calculate.
 *
 * @package QFINHUB_Calculators
 */

defined( 'ABSPATH' ) || exit;

/**
 * Reads and caches calculator definitions.
 */
class QFINHUB_Calculator_Registry {

	/**
	 * Cached definitions.
	 *
	 * @var array|null
	 */
	private static $calculators = null;

	/**
	 * Load every calculator definition.
	 *
	 * @return array
	 */
	public static function all() {
		if ( null !== self::$calculators ) {
			return self::$calculators;
		}

		$path = QFINHUB_CALC_PATH . 'assets/data/calculators.json';
		if ( ! file_exists( $path ) ) {
			self::$calculators = array();
			return self::$calculators;
		}

		$raw   = file_get_contents( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		$data  = json_decode( $raw, true );
		$clean = array();

		if ( is_array( $data ) ) {
			foreach ( $data as $calc ) {
				if ( empty( $calc['id'] ) || empty( $calc['name'] ) ) {
					continue;
				}
				$clean[ $calc['id'] ] = $calc;
			}
		}

		self::$calculators = $clean;
		return self::$calculators;
	}

	/**
	 * Fetch one calculator by id.
	 *
	 * @param string $id Calculator id.
	 * @return array|null
	 */
	public static function get( $id ) {
		$all = self::all();
		$id  = sanitize_title( $id );
		return isset( $all[ $id ] ) ? $all[ $id ] : null;
	}

	/**
	 * Group definitions by category, for the block inserter and a listing page.
	 *
	 * @return array<string, array>
	 */
	public static function by_category() {
		$out = array();
		foreach ( self::all() as $calc ) {
			$cat         = isset( $calc['category'] ) ? $calc['category'] : 'Other';
			$out[ $cat ] = isset( $out[ $cat ] ) ? $out[ $cat ] : array();
			$out[ $cat ][] = $calc;
		}
		ksort( $out );
		return $out;
	}

	/**
	 * Count of registered calculators.
	 *
	 * @return int
	 */
	public static function count() {
		return count( self::all() );
	}
}

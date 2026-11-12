<?php
/**
 * Asset loading.
 *
 * The runtime is only enqueued on pages that actually contain a calculator.
 * Shipping a 12KB script on every page of every site that installs this would be
 * the fastest way to earn one-star reviews, so loading is conditional on the
 * shortcode or block having rendered.
 *
 * @package QFINHUB_Calculators
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registers and conditionally enqueues front-end assets.
 */
class QFINHUB_Assets {

	/**
	 * Whether a calculator has been rendered on this request.
	 *
	 * @var bool
	 */
	private static $needed = false;

	/**
	 * Hook up.
	 */
	public static function init() {
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register' ) );
		add_action( 'wp_footer', array( __CLASS__, 'maybe_print_styles' ), 5 );
	}

	/**
	 * Register (but do not yet enqueue) the assets.
	 */
	public static function register() {
		wp_register_style(
			'qfinhub-calculators',
			QFINHUB_CALC_URL . 'assets/css/qfinhub-calculators.css',
			array(),
			QFINHUB_CALC_VERSION
		);

		wp_register_script(
			'qfinhub-calculators',
			QFINHUB_CALC_URL . 'assets/js/qfinhub-calculators.js',
			array(),
			QFINHUB_CALC_VERSION,
			true
		);
	}

	/**
	 * Called by the shortcode/block renderer when a calculator is emitted.
	 *
	 * Registers on demand rather than assuming wp_enqueue_scripts already ran.
	 * A shortcode can render before that hook — in a widget, a late block pattern,
	 * or any non-standard render path — and in that case enqueueing an unregistered
	 * handle fails silently and the calculator ships unstyled.
	 */
	public static function mark_needed() {
		if ( self::$needed ) {
			return;
		}
		self::$needed = true;

		if ( ! wp_style_is( 'qfinhub-calculators', 'registered' ) ) {
			self::register();
		}

		wp_enqueue_style( 'qfinhub-calculators' );
		wp_enqueue_script( 'qfinhub-calculators' );
	}

	/**
	 * Whether anything was rendered.
	 *
	 * @return bool
	 */
	public static function is_needed() {
		return self::$needed;
	}

	/**
	 * Fallback style printer.
	 *
	 * Block themes occasionally render blocks after wp_enqueue_scripts has run when
	 * a pattern is injected late. If that happens the style registration is missed
	 * and the calculator would render unstyled, so print it inline as a safety net.
	 */
	public static function maybe_print_styles() {
		if ( ! self::$needed || wp_style_is( 'qfinhub-calculators', 'done' ) ) {
			return;
		}
		wp_print_styles( array( 'qfinhub-calculators' ) );
	}
}

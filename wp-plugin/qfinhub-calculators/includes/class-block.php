<?php
/**
 * Gutenberg block registration.
 *
 * Dynamic block: the server renders the mount point and the JS takes over, so a
 * block saved in the editor never contains stale markup if the calculator
 * definition changes later.
 *
 * @package QFINHUB_Calculators
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registers the block.
 */
class QFINHUB_Block {

	/**
	 * Hook up.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'editor_data' ) );
	}

	/**
	 * Hand the calculator list to the block editor.
	 *
	 * The editor dropdown is built from the registry rather than hard-coded, so it
	 * can never drift from the calculators that actually exist.
	 */
	public static function editor_data() {
		$options = array();
		foreach ( QFINHUB_Calculator_Registry::all() as $calc ) {
			$options[] = array(
				'value' => $calc['id'],
				'label' => $calc['name'],
			);
		}

		wp_localize_script(
			'qfinhub-calculator-editor-script',
			'qfinhubBlockData',
			array( 'calculators' => $options )
		);
	}

	/**
	 * Register the block from block.json and attach the render callback.
	 */
	public static function register() {
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		$dir = QFINHUB_CALC_PATH . 'blocks';

		register_block_type(
			$dir,
			array(
				'render_callback' => array( __CLASS__, 'render' ),
			)
		);
	}

	/**
	 * Server-side render for the block.
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function render( $attributes = array() ) {
		$id    = isset( $attributes['calculatorId'] ) ? sanitize_title( $attributes['calculatorId'] ) : '';
		$title = isset( $attributes['title'] ) ? $attributes['title'] : '';

		if ( '' === $id ) {
			return '';
		}

		return QFINHUB_Shortcode::render_one(
			array(
				'id'    => $id,
				'title' => $title,
			)
		);
	}
}

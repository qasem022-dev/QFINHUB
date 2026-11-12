<?php
/**
 * Shortcode renderer.
 *
 * Usage:
 *   [qfinhub_calculator id="mortgage-payment"]
 *   [qfinhub_calculator id="auto-loan" title="Car payment"]
 *   [qfinhub_calculators]              // list every available calculator
 *
 * @package QFINHUB_Calculators
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registers the [qfinhub_calculator] and [qfinhub_calculators] shortcodes.
 */
class QFINHUB_Shortcode {

	/**
	 * Hook up.
	 */
	public static function init() {
		add_shortcode( 'qfinhub_calculator', array( __CLASS__, 'render_one' ) );
		add_shortcode( 'qfinhub_calculators', array( __CLASS__, 'render_list' ) );
	}

	/**
	 * Build the markup for a single calculator.
	 *
	 * The definition is passed as a JSON attribute rather than fetched over REST:
	 * no extra request, no REST permission surface, and it works when the page is
	 * cached as static HTML.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public static function render_one( $atts ) {
		$atts = shortcode_atts(
			array(
				'id'    => '',
				'title' => '',
			),
			$atts,
			'qfinhub_calculator'
		);

		$id  = sanitize_title( $atts['id'] );
		$def = QFINHUB_Calculator_Registry::get( $id );

		if ( ! $def ) {
			return self::admin_notice( $id );
		}

		QFINHUB_Assets::mark_needed();

		$title = '' !== $atts['title'] ? $atts['title'] : $def['name'];

		$html  = '<div class="qfc-wrap">';
		$html .= '<h3 class="qfc-title">' . esc_html( $title ) . '</h3>';
		$html .= sprintf(
			'<div class="qfc-mount" data-calculator="%1$s" data-definition="%2$s"></div>',
			esc_attr( $id ),
			esc_attr( wp_json_encode( $def ) )
		);
		$html .= '</div>';

		return $html;
	}

	/**
	 * Render an index of every available calculator.
	 *
	 * @return string
	 */
	public static function render_list() {
		$grouped = QFINHUB_Calculator_Registry::by_category();
		if ( empty( $grouped ) ) {
			return '';
		}

		QFINHUB_Assets::mark_needed();

		$html = '<div class="qfc-index">';
		foreach ( $grouped as $category => $calcs ) {
			$html .= '<div class="qfc-index-group">';
			$html .= '<h4 class="qfc-index-cat">' . esc_html( $category ) . '</h4>';
			$html .= '<ul class="qfc-index-list">';
			foreach ( $calcs as $calc ) {
				$html .= sprintf(
					'<li><a href="%1$s">%2$s</a></li>',
					esc_url( '#' . sanitize_title( $calc['id'] ) ),
					esc_html( $calc['name'] )
				);
			}
			$html .= '</ul></div>';
		}
		$html .= '</div>';

		return $html;
	}

	/**
	 * Helpful message when an unknown id is requested.
	 *
	 * Shown only to editors: a visitor should never see a plugin error message.
	 *
	 * @param string $id Requested id.
	 * @return string
	 */
	private static function admin_notice( $id ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return '';
		}
		return sprintf(
			'<p style="padding:10px;border-left:4px solid #d63638;background:#fcf0f1;font-family:monospace;">%s</p>',
			esc_html(
				sprintf(
					/* translators: %s: calculator id */
					__( 'QFINHUB Calculators: no calculator found for id "%s".', 'qfinhub-calculators' ),
					$id
				)
			)
		);
	}
}

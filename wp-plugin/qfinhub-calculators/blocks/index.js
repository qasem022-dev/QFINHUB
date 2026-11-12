/**
 * Block editor script.
 *
 * Written against the wp.* globals WordPress provides rather than bundled, so the
 * plugin ships without a build step — no node_modules, no compiled artefacts, and
 * nothing for the plugin review team to reconstruct.
 */
(function (wp) {
	'use strict';

	if (!wp || !wp.blocks || !wp.element) {
		return;
	}

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var InspectorControls = wp.blockEditor && wp.blockEditor.InspectorControls;
	var useBlockProps = wp.blockEditor && wp.blockEditor.useBlockProps;
	var PanelBody = wp.components && wp.components.PanelBody;
	var SelectControl = wp.components && wp.components.SelectControl;
	var TextControl = wp.components && wp.components.TextControl;
	var ServerSideRender = wp.serverSideRender;

	// Populated by wp_localize_script from the registry, so the editor list can
	// never drift from the calculators that actually exist.
	var available = (window.qfinhubBlockData && window.qfinhubBlockData.calculators) || [
		{ value: 'mortgage-payment', label: 'Mortgage Payment' }
	];

	wp.blocks.registerBlockType('qfinhub/calculator', {
		edit: function (props) {
			var attributes = props.attributes;
			var setAttributes = props.setAttributes;

			var controls = [
				el(
					InspectorControls,
					{ key: 'inspector' },
					el(
						PanelBody,
						{ title: __('Calculator', 'qfinhub-calculators'), initialOpen: true },
						el(SelectControl, {
							label: __('Which calculator', 'qfinhub-calculators'),
							value: attributes.calculatorId,
							options: available,
							onChange: function (value) {
								setAttributes({ calculatorId: value });
							}
						}),
						el(TextControl, {
							label: __('Override heading (optional)', 'qfinhub-calculators'),
							value: attributes.title || '',
							onChange: function (value) {
								setAttributes({ title: value });
							}
						})
					)
				)
			];

			var preview = ServerSideRender
				? el(ServerSideRender, {
						block: 'qfinhub/calculator',
						attributes: attributes
				  })
				: el(
						'p',
						null,
						__('Preview unavailable — the calculator still renders on the front end.', 'qfinhub-calculators')
				  );

			var blockProps = useBlockProps ? useBlockProps() : {};

			return el('div', blockProps, controls, preview);
		},

		// Dynamic block: the server renders it, so nothing is stored in post content.
		save: function () {
			return null;
		}
	});
})(window.wp);

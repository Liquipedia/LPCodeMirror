if ( !String.prototype.startsWith ) {
	String.prototype.startsWith = function( searchString, position ) {
		position = position || 0;
		return this.substr( position, searchString.length ) === searchString;
	};
}

if ( !String.prototype.endsWith ) {
	String.prototype.endsWith = function( searchString, position ) {
		var subjectString = this.toString();
		if ( typeof position !== 'number' || !isFinite( position ) || Math.floor( position ) !== position || position > subjectString.length ) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.indexOf( searchString, position );
		return lastIndex !== -1 && lastIndex === position;
	};
}

if ( !String.prototype.includes ) {
	String.prototype.includes = function( search, start ) {
		'use strict';
		if ( typeof start !== 'number' ) {
			start = 0;
		}
		if ( start + search.length > this.length ) {
			return false;
		} else {
			return this.indexOf( search, start ) !== -1;
		}
	};
}

/*
 * Adapted from https://www.mediawiki.org/wiki/Extension:CodeMirror
 * License: GPL 2.0 or later
 */

( function( mw, $ ) {
	if ( mw.config.get( 'wgCodeEditorCurrentLanguage' ) ) { // If the CodeEditor is used then just exit;
		return;
	}
	if ( !( mw.config.get( 'wgAction' ) === 'edit' || mw.config.get( 'wgAction' ) === 'submit' ) ) {
		return;
	}

	// codeMirror needs a special textselection jQuery function to work,
	// save the current one to restore when CodeMirror get's disabled.
	var origTextSelection = $.fn.textSelection,
		codeMirrorPhone = mw.user.options.get( 'lpcodemirror-prefs-use-codemirror-phone' ) === '1' || mw.user.options.get( 'lpcodemirror-prefs-use-codemirror-phone' ) === 1,
		codeMirrorTablet = mw.user.options.get( 'lpcodemirror-prefs-use-codemirror-tablet' ) === '1' || mw.user.options.get( 'lpcodemirror-prefs-use-codemirror-tablet' ) === 1,
		codeMirrorDesktop = mw.user.options.get( 'lpcodemirror-prefs-use-codemirror' ) === '1' || mw.user.options.get( 'lpcodemirror-prefs-use-codemirror' ) === 1,
		codeMirror,
		// function for a textselection function for CodeMirror
		cmTextSelection = function( command, options ) {
			if ( !codeMirror || codeMirror.getTextArea() !== this[ 0 ] ) {
				return origTextSelection.call( this, command, options );
			}
			var fn, retval;

			fn = {
				/*
				 * Get the contents of the textarea
				 */
				getContents: function() {
					return codeMirror.getValue();
				},

				setContents: function( newContents ) {
					codeMirror.setValue( newContents );
				},

				/*
				 * Get the currently selected text in this textarea. Will focus the textarea
				 * in some browsers (IE/Opera)
				 */
				getSelection: function() {
					return codeMirror.getSelection();
				},

				/*
				 * Inserts text at the beginning and end of a text selection, optionally
				 * inserting text at the caret when selection is empty.
				 */
				encapsulateSelection: function( options ) {
					return this.each( function() {
						var insertText,
							selText,
							selectPeri = options.selectPeri,
							pre = options.pre,
							post = options.post,
							startCursor = codeMirror.getCursor( true ),
							endCursor = codeMirror.getCursor( false );

						if ( options.selectionStart !== undefined ) {
							// fn[command].call( this, options );
							fn.setSelection(
								{ start: options.selectionStart, end: options.selectionEnd }
							); // not tested
						}

						selText = codeMirror.getSelection();
						if ( !selText ) {
							selText = options.peri;
						} else if ( options.replace ) {
							selectPeri = false;
							selText = options.peri;
						} else {
							selectPeri = false;
							while ( selText.charAt( selText.length - 1 ) === ' ' ) {
								// Exclude ending space char
								selText = selText.substring( 0, selText.length - 1 );
								post += ' ';
							}
							while ( selText.charAt( 0 ) === ' ' ) {
								// Exclude prepending space char
								selText = selText.substring( 1, selText.length );
								pre = ' ' + pre;
							}
						}

						/*
						 * Do the splitlines stuff.
						 *
						 * Wrap each line of the selected text with pre and post
						 */
						function doSplitLines( selText, pre, post ) {
							var i,
								insertText = '',
								selTextArr = selText.split( '\n' );

							for ( i = 0; i < selTextArr.length; i++ ) {
								insertText += pre + selTextArr[ i ] + post;
								if ( i !== selTextArr.length - 1 ) {
									insertText += '\n';
								}
							}
							return insertText;
						}

						if ( options.splitlines ) {
							selectPeri = false;
							insertText = doSplitLines( selText, pre, post );
						} else {
							insertText = pre + selText + post;
						}

						if ( options.ownline ) {
							if ( startCursor.ch !== 0 ) {
								insertText = '\n' + insertText;
								pre += '\n';
							}

							if ( codeMirror.getLine( endCursor.line ).length !== endCursor.ch ) {
								insertText += '\n';
								post += '\n';
							}
						}

						codeMirror.replaceSelection( insertText );

						if ( selectPeri ) {
							codeMirror.setSelection(
								codeMirror.posFromIndex(
									codeMirror.indexFromPos( startCursor ) + pre.length
								),
								codeMirror.posFromIndex(
									codeMirror.indexFromPos( startCursor ) +
									pre.length + selText.length
								)
							);
						}
					} );
				},

				/*
				 * Get the position (in resolution of bytes not necessarily characters)
				 * in a textarea
				 */
				getCaretPosition: function( options ) {
					var caretPos = codeMirror.indexFromPos( codeMirror.getCursor( true ) ),
						endPos = codeMirror.indexFromPos( codeMirror.getCursor( false ) );
					if ( options.startAndEnd ) {
						return [ caretPos, endPos ];
					}
					return caretPos;
				},

				setSelection: function( options ) {
					return this.each( function() {
						codeMirror.setSelection(
							codeMirror.posFromIndex( options.start ),
							codeMirror.posFromIndex( options.end )
						);
					} );
				},

				/*
				 * Scroll a textarea to the current cursor position. You can set the cursor
				 * position with setSelection()
				 */
				scrollToCaretPosition: function() {
					return this.each( function() {
						codeMirror.scrollIntoView( null );
					} );
				}
			};

			switch ( command ) {
				// case 'getContents': // no params
				// case 'setContents': // no params with defaults
				// case 'getSelection': // no params
				case 'encapsulateSelection':
					options = $.extend( {
						// Text to insert before the cursor/selection
						pre: '',
						// Text to insert between pre and post and select afterwards
						peri: '',
						// Text to insert after the cursor/selection
						post: '',
						// Put the inserted text on a line of its own
						ownline: false,
						// If there is a selection, replace it with peri instead of leaving it alone
						replace: false,
						// Select the peri text if it was inserted (but not if there was
						// a selection and replace==false, or if splitlines==true)
						selectPeri: true,
						// If multiple lines are selected, encapsulate each line individually
						splitlines: false,
						// Position to start selection at
						selectionStart: undefined,
						// Position to end selection at. Defaults to start
						selectionEnd: undefined
					}, options );
					break;
				case 'getCaretPosition':
					options = $.extend( {
						// Return [start, end] instead of just start
						startAndEnd: false
					}, options );
					// FIXME: We may not need character position-based functions
					// if we insert markers in the right places
					break;
				case 'setSelection':
					options = $.extend( {
						// Position to start selection at
						start: undefined,
						// Position to end selection at. Defaults to start
						end: undefined,
						// Element to start selection in (iframe only)
						startContainer: undefined,
						// Element to end selection in (iframe only). Defaults to startContainer
						endContainer: undefined
					}, options );

					if ( options.end === undefined ) {
						options.end = options.start;
					}
					if ( options.endContainer === undefined ) {
						options.endContainer = options.startContainer;
					}
					// FIXME: We may not need character position-based
					// functions if we insert markers in the right places
					break;
				case 'scrollToCaretPosition':
					options = $.extend( {
						force: false // Force a scroll even if the caret position is already visible
					}, options );
					break;
			}

			retval = fn[ command ].call( this, options );
			codeMirror.focus();

			return retval;
		},
		originHooksTextarea = $.valHooks.textarea;

	/**
	 * Replaces the default textarea with CodeMirror
	 */
	function enableCodeMirror() {
		var config = mw.config.get( 'LPCodeMirrorConfig' );
		var $textbox1 = $( '#wpTextbox1' );

		if ( $textbox1[ 0 ].style.display === 'none' ) {
			return;
		}
		var editmode;
		var indentmode;
		var pageContentModel = mw.config.get( 'wgPageContentModel' );
		if ( pageContentModel === 'wikitext' ) {
			editmode = 'text/mediawiki';
			indentmode = true;
		} else if ( pageContentModel === 'Scribunto' ) {
			editmode = 'text/x-lua';
			indentmode = true;
		} else if ( pageContentModel === 'css' ) {
			editmode = 'text/x-less';
			indentmode = true;
		} else if ( pageContentModel === 'javascript' ) {
			editmode = 'text/javascript';
			indentmode = true;
		} else {
			editmode = 'text/mediawiki';
			indentmode = false;
		}
		var linewrapping = mw.user.options.get( 'lpcodemirror-prefs-use-codemirror-linewrap' ) === '1' ||
			mw.user.options.get( 'lpcodemirror-prefs-use-codemirror-linewrap' ) === 1;
		codeMirror = CodeMirror.fromTextArea( $textbox1[ 0 ], {
			mwConfig: config,
			lineNumbers: true,
			mode: editmode,
			autofocus: true,
			flattenSpans: false,
			matchBrackets: true,
			viewportMargin: 5000,
			indentWithTabs: indentmode,
			indentUnit: 4,
			extraKeys: {
				F11: function( cm ) {
					cm.setOption( 'fullScreen', !cm.getOption( 'fullScreen' ) );
				},
				Esc: function( cm ) {
					if ( cm.getOption( 'fullScreen' ) ) {
						cm.setOption( 'fullScreen', false );
					}
				}
			},
			readOnly: $textbox1[ 0 ].readOnly,
			lineWrapping: linewrapping,
			styleActiveLine: true
		} );
		// Our best friend, IE, needs some special css
		if ( window.navigator.userAgent.indexOf( 'Trident/' ) > -1 ) {
			$( '.CodeMirror' ).addClass( 'CodeMirrorIE' );
		}
		if ( linewrapping ) {
			$( '.CodeMirror' ).addClass( 'lineWrapping' );
		}

		// set the height of the textarea
		codeMirror.setSize( null, $textbox1.height() );
		// Overwrite default textselection of WikiEditor to work with CodeMirror, too
		$.fn.textSelection = cmTextSelection;

		function openPageOnClick( cssClass, element ) {
			var pagename = element.text();
			var index = element.index();
			var counter;

			counter = index - 1;
			while ( element.parent().children().eq( counter ).hasClass( cssClass ) ) {
				pagename = element.parent().children().eq( counter ).text() + pagename;
				counter--;
			}

			counter = index + 1;
			while ( element.parent().children().eq( counter ).hasClass( cssClass ) ) {
				pagename = pagename + element.parent().children().eq( counter ).text();
				counter++;
			}

			pagename = pagename.substr( 0, 1 ).toUpperCase() + pagename.substr( 1 );

			if ( cssClass === 'cm-mw-template-name' ) {
				if ( pagename.startsWith( ':' ) ) {
					pagename = pagename.substr( 1 );
				} else if ( !pagename.includes( ':' ) ) {
					pagename = 'Template:' + pagename;
				}
			}

			window.open( mw.config.get( 'wgScriptPath' ) + '/' + pagename );
		}

		$( '.CodeMirror' ).on( 'click', '.cm-mw-template-name', function( e ) {
			if ( e.altKey ) {
				openPageOnClick( 'cm-mw-template-name', $( this ) );
			}
		} );

		$( '.CodeMirror' ).on( 'click', '.cm-mw-link-pagename', function( e ) {
			if ( e.altKey ) {
				openPageOnClick( 'cm-mw-link-pagename', $( this ) );
			}
		} );
	}

	// enable CodeMirror
	if ( window.innerWidth <= 767 ) {
		codeMirror = codeMirrorPhone;
	} else if ( window.innerWidth <= 991 ) {
		codeMirror = codeMirrorTablet;
	} else {
		codeMirror = codeMirrorDesktop;
	}
	if ( codeMirror ) {
		mw.hook( 'wikipage.editform' ).add( function() {
			enableCodeMirror();

			// define JQuery hook for searching and replacing text using
			// JS if CodeMirror is enabled, see Bug: T108711
			$.valHooks.textarea = {
				get: function( elem ) {
					if ( elem.id === 'wpTextbox1' && codeMirror ) {
						return codeMirror.getValue();
					} else if ( originHooksTextarea ) {
						return originHooksTextarea.get( elem );
					}
					return elem.value;
				},
				set: function( elem, value ) {
					if ( elem.id === 'wpTextbox1' && codeMirror ) {
						return codeMirror.setValue( value );
					} else if ( originHooksTextarea ) {
						return originHooksTextarea.set( elem, value );
					}
					elem.value = value;
				}
			};
		} );
	}
}( mw, jQuery ) );

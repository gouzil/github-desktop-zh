import { Entry, LicenseLookup } from 'legal-eagle'

const tslibLicenseOverride: Entry = {
  repository: 'git+https://github.com/microsoft/tslib',
  license: 'BSD',
  source:
    'https://github.com/microsoft/tslib/blob/74f1ff794985b33657b599b611e82937e3074617/LICENSE.txt',
  sourceText: `Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.`,
}

export const licenseOverrides: LicenseLookup = {
  'cycle@1.0.3': {
    repository: 'git+ssh://git@github.com/dscape/cycle',
    license: 'Public Domain',
    source:
      'cycle.js header comment at https://github.com/dscape/cycle/blob/ab67ce90e8fa2efdb8f21074661366ec56f6a724/cycle.js',
    sourceText:
      'Public Domain.\n\nNO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.',
  },

  'json-schema@0.2.3': {
    repository: 'git+ssh://git@github.com/kriszyp/json-schema',
    license: 'BSD',
    source:
      'README.md at https://github.com/kriszyp/json-schema/tree/24c4ed1b2359ab457a00e90606a777c2962ecd3b',
    sourceText:
      'Code is licensed under the AFL or BSD 3-Clause license as part of the Persevere project which is administered under the Dojo foundation, and all contributions require a Dojo CLA.',
  },

  'wicg-focus-ring@1.0.1': {
    repository: 'git+https://github.com/WICG/focus-ring',
    license: 'MIT',
    source:
      'https://github.com/WICG/focus-ring/blob/4df78f379e4c7dbaa1a5e4ff25cf1b56700b24ee/LICENSE.md',
    sourceText: `This work is being provided by the copyright holders under the following license.

License

By obtaining and/or copying this work, you (the licensee) agree that you have read, understood, and will comply with the following terms and conditions.

Permission to copy, modify, and distribute this work, with or without modification, for any purpose and without fee or royalty is hereby granted, provided that you include the following on ALL copies of the work or portions thereof, including modifications:

* The full text of this NOTICE in a location viewable to users of the redistributed or derivative work.
* Any pre-existing intellectual property disclaimers, notices, or terms and conditions. If none exist, the W3C Software and Document Short Notice should be included.
* Notice of any changes or modifications, through a copyright statement on the new code or document such as "This software or document includes material copied from or derived from [title and URI of the W3C document]. Copyright © [YEAR] W3C® (MIT, ERCIM, Keio, Beihang)."

Disclaimers

THIS WORK IS PROVIDED "AS IS," AND COPYRIGHT HOLDERS MAKE NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY OR FITNESS FOR ANY PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE OR DOCUMENT WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS, TRADEMARKS OR OTHER RIGHTS.

COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR DOCUMENT.

The name and trademarks of copyright holders may NOT be used in advertising or publicity pertaining to the work without specific, written prior permission. Title to copyright in this work will at all times remain with copyright holders.`,
  },

  'tslib@2.0.0': tslibLicenseOverride,
  'tslib@2.3.1': tslibLicenseOverride,
}

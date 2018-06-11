[![Donate](http://www.opensourcecitizen.org/badge)](http://www.opensourcecitizen.org/project?url=github.com/motdotla/node-lambda-template)

If you found this library useful, donate some CPU cycles to this project by clicking above. Thank you! 😇

# Toolkits Search

This project is based on [node-lambda-template], which uses [node-lambda](https://github.com/motdotla/node-lambda) under the hood to locally run and also deploy your node.js Amazon Lambda application.

## Install

Clone this repository.

```
cd /your/path
npm install
```

## Usage

There are 4 available commands to use on this template. For more info and usage descriptions, see the [node-lambda](https://github.com/motdotla/node-lambda) repository.

```
cd /your/path
npm run setup # setup node-lambda files
npm run test # test your event handler and check output
npm run fix # run standard --fix
npm run package # just generate the zip that would be uploaded to AWS
npm run deploy # deploy to AWS
```

## Example Workflow

The app is broken up into 5 stages for each Toolkits config:
1.  Fetch the data from Salesforce into a single collection.
2.  Pre-process the fields for all entries.
3.  Assign the relational ids to each entry.
4.  Post-process the fields for all entries.
5.  Upload the resulting data to S3 and freshen the endpoint.  

## Step 1
Taking Environmental Solutions as an example, after Step 1, the `query_result` object will look something like this:

	{
	  "filter_groups": [
	    {
	      "name": "Environmental Issue",
	      "filterItems": [
	        {
	          "summary": "EPA revised the new source performance standards for volatile organic compounds from leaking components at onshore natural gas processing plants and new source performance standards for sulfur dioxide emissions from natural gas processing plants. The EPA also established standards for certain oil and gas operations not covered by the existing standards. In addition to the operations covered by the existing standards, the newly established standards will regulate volatile organic compound emissions from gas wells, centrifugal compressors, reciprocating compressors, pneumatic controllers and storage vessels.",
	          "productIds": [
	            "01tt0000000Ui08AAC",
	            "01tt0000000Ui0cAAC",
	            "01tt0000000Ui1TAAS"
	          ],
	          "name": "Emissions Control for Oil and Natural Gas Processing",
	          "linksSize": 2,
	          "links": [
	            {
	              "url": "https://www.epa.gov/controlling-air-pollution-oil-and-natural-gas-industry",
	              "name": "U.S. EPA Regulatory Background",
	              "id": "a3Lt0000000JAPBEA4"
	            },
	            {
	              "url": "http://www.epa.gov/ttn/ecas/regdata/RIAs/oilnaturalgasfinalria.pdf",
	              "name": "Analysis: Proposed NSPS & Amendments: NESHAP: Oil & Natural Gas",
	              "id": "a3Lt0000000JAPPEA4"
	            }
	          ],
	          "id": "a0vt0000000U6UaAAK"
	        },
	       	...
	      ]
	    },
	    {
	      "name": "EPA Regulation",
	      "filterItems": [
	        {
	          "productIds": [
	            "01tt0000000Ui08AAC",
	            "01tt0000000Ui0cAAC",
	            "01tt0000000Ui1TAAS"
	          ],
	          "name": "SOP for New Stationary Sources: Oil & Gas",
	          "linksSize": 2,
	          "links": [
	            {
	              "url": "https://go.usa.gov/xRREB",
	              "name": "Standards of Performance for New Stationary Sources: Oil and",
	              "id": "a3Lt0000000JAOWEA4"
	            },
	            {
	              "url": "https://go.usa.gov/xnqDS",
	              "name": "Contact the U.S. EPA",
	              "id": "a3Lt0000000JAOXEA4"
	            }
	          ],
	          "id": "a0vt0000000U6WHAA0"
	        },
	       	...
	      ]
	    },
	    {
	      "name": "Solution",
	      "filterItems": [
	        {
	          "productIds": [
	            "01tt0000000Ui08AAC"
	          ],
	          "name": "Absorption Towers",
	          "linksSize": 0,
	          "links": [],
	          "id": "01tt0000000Ui08AAC"
	        },
	        ...
	      ]
	    },
	    {
	      "name": "Provider",
	      "filterItems": [
	        {
	          "attributes": {
	            "type": "Participation__c",
	            "url": "/services/data/v39.0/sobjects/Participation__c/a2zt00000008QpDAAU"
	          },
	          "Id": "a2zt00000008QpDAAU",
	          "Name": "Testing Toolkits 030632018",
	          "Company_Description__c": "This is test"
	        },
	        ...
	      ]
	    }
	  ]
	"solutions_with_providers": [
	    {
	      "attributes": {
	        "type": "Asset",
	        "url": "/services/data/v39.0/sobjects/Asset/02it0000000Ld1wAAC"
	      },
	      "Id": "02it0000000Ld1wAAC",
	      "Name": "Flash Tanks",
	      "Participant__c": "a2zt0000000GowEAAS"
	    },
	    ...
	  ]
	}

## Step 2
The pre-processing in Step 2 adds id fields and a type field to each entry, so the Provider entry above would become:

	{
	  "attributes": {
	    "type": "Participation__c",
	    "url": "/services/data/v39.0/sobjects/Participation__c/a2zt00000008QpDAAU"
	  },
	  "Id": "a2zt00000008QpDAAU",
	  "Name": "Testing Toolkits 030632018",
	  "Company_Description__c": "This is test",
	  "solution_id": [],
	  "provider_id": [
	    0
	  ],
	  "issue_id": [],
	  "regulation_id": [],
	  "type": "Provider"
	}


It also flattens out the data structure:

	{
		issues: [],
		regulations: [],
		solutions: [],
		providers: [],
		solutions_with_providers: []
	}

And transforms the solutions with providers to a solution name that references an array of Providers ids:

	  "solutions_with_providers": {
	    "Flash Tanks": [
	      "a2zt0000000GowEAAS"
	    ],
	  }

## Step 3 
Builds out all of the id relationships between the entries using the data structure above.  The result will look the same, but have all id fields populated for issues, regulations, solutions, and providers.

## Step 4
This provides the final steps for readying the entries for ingestion, such as removing unneeded fields.  It also flattens all entries into a single array:

	[
	  {
	    "summary": "EPA revised the new source performance standards for volatile organic compounds from leaking components at onshore natural gas processing plants and new source performance standards for sulfur dioxide emissions from natural gas processing plants. The EPA also established standards for certain oil and gas operations not covered by the existing standards. In addition to the operations covered by the existing standards, the newly established standards will regulate volatile organic compound emissions from gas wells, centrifugal compressors, reciprocating compressors, pneumatic controllers and storage vessels.",
	    "name": "Emissions Control for Oil and Natural Gas Processing",
	    "links": [
	      {
	        "url": "https://www.epa.gov/controlling-air-pollution-oil-and-natural-gas-industry",
	        "display_name": "U.S. EPA Regulatory Background"
	      },
	      {
	        "url": "http://www.epa.gov/ttn/ecas/regdata/RIAs/oilnaturalgasfinalria.pdf",
	        "display_name": "Analysis: Proposed NSPS & Amendments: NESHAP: Oil & Natural Gas"
	      }
	    ],
	    "solution_id": [
	      0,
	      17,
	      41
	    ],
	    "provider_id": [
	      1,
	      5
	    ],
	    "issue_id": [
	      0
	    ],
	    "regulation_id": [
	      0
	    ],
	    "type": "Environmental Issue"
	  },
	  ...
	]


## Step 5
The result of Step 4 will be written to the needed bucket, and once successful, the endpoint is freshened. 

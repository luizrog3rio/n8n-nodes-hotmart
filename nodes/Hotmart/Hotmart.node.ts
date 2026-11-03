import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { getProducts } from './listSearch/getProducts';
import { account } from './resources/account';
import { product } from './resources/product';
import type { HotmartResource } from './shared/types';

const RESOURCES: Record<string, { name: string; resource: HotmartResource }> = {
	account: { name: 'Account', resource: account },
	product: { name: 'Product', resource: product },
};

export class Hotmart implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hotmart',
		name: 'hotmart',
		icon: { light: 'file:../../icons/hotmart.svg', dark: 'file:../../icons/hotmart.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Work with sales, subscriptions, coupons, products and more in Hotmart',
		defaults: { name: 'Hotmart' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'hotmartApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: Object.entries(RESOURCES).map(([value, { name }]) => ({ name, value })),
				default: 'product',
			},
			...Object.values(RESOURCES).flatMap(({ resource }) => resource.description),
		],
	};

	methods = {
		listSearch: { getProducts },
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resourceName = this.getNodeParameter('resource', i) as string;
				const operationName = this.getNodeParameter('operation', i) as string;
				const operation = RESOURCES[resourceName]?.resource.operations[operationName];
				if (!operation) {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operationName}" is not supported for "${resourceName}"`,
						{ itemIndex: i },
					);
				}

				const result = await operation.execute.call(this, i);
				returnData.push(
					...this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(result as IDataObject | IDataObject[]),
						{ itemData: { item: i } },
					),
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error.errorResponse ?? {}, {
						message: error.message,
						description: error.description ?? undefined,
						httpCode: error.httpCode ?? undefined,
						itemIndex: i,
					});
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

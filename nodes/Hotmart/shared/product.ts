import { NodeOperationError, type IDataObject, type IExecuteFunctions } from 'n8n-workflow';

import { hotmartApiRequest } from './transport';

/** Offers and plans endpoints take the product ucode; users only know the numeric ID. */
export async function resolveProductUcode(this: IExecuteFunctions, productId: number): Promise<string> {
	const response = await hotmartApiRequest.call(this, 'GET', '/products/api/v1/products', {
		id: productId,
	});
	const product = ((response.items ?? []) as IDataObject[])[0];
	if (!product?.ucode) {
		throw new NodeOperationError(this.getNode(), `Product ${productId} not found in this Hotmart account`);
	}
	return String(product.ucode);
}

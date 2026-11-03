import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

export interface HotmartOperation {
	description: INodeProperties[];
	execute(this: IExecuteFunctions, i: number): Promise<IDataObject | IDataObject[]>;
}

export interface HotmartResource {
	/** Fields of the resource: the operation dropdown plus every operation's fields */
	description: INodeProperties[];
	operations: Record<string, HotmartOperation>;
}

/** Builds the operation dropdown and merges the operations' fields. */
export function buildResource(
	resource: string,
	operations: Array<{ value: string; name: string; action: string; description: string; operation: HotmartOperation }>,
	defaultOperation: string,
): HotmartResource {
	return {
		description: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: [resource] } },
				options: operations.map(({ name, value, action, description }) => ({ name, value, action, description })),
				default: defaultOperation,
			},
			...operations.flatMap((o) => o.operation.description),
		],
		operations: Object.fromEntries(operations.map((o) => [o.value, o.operation])),
	};
}

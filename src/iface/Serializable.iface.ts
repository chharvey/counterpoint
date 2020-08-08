/**
 * A Serializable object can be serialized into a string.
 */
export default interface Serializable {
	/**
	 * Return an XML string of this object.
	 * @returns a string formatted as an XML element
	 */
	serialize(): string;
}

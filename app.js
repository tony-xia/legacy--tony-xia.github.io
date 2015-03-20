var CodeProperty = (function () {
    function CodeProperty() {
        this.type = "";
        this.typeWithoutList = "";
        this.name = "";
        this.isList = false;
        this.listItemType = "";
    }
    return CodeProperty;
})();
var CodeClass = (function () {
    function CodeClass() {
        this.name = "";
        this.properties = [];
    }
    return CodeClass;
})();
var CodeEnum = (function () {
    function CodeEnum() {
        this.name = "";
    }
    return CodeEnum;
})();
var PseudoCode = (function () {
    function PseudoCode() {
        this.codeClass = new CodeClass();
        this.enums = [];
    }
    return PseudoCode;
})();
function camelNaming(name) {
    var nameLower = name.toLowerCase();
    if (name.length <= 1) {
        return nameLower;
    }
    else {
        return nameLower.substr(0, 1) + name.substr(1);
    }
}
function parseCode(pseudoCodeString) {
    pseudoCodeString = pseudoCodeString.replaceAll("\r", "");
    var lines = pseudoCodeString.split("\n");
    var pseudoCode = new PseudoCode();
    var codeClass = pseudoCode.codeClass;
    var enums = pseudoCode.enums;
    var StageLookupClassName = 0;
    var StageLookupClassBlock = 1;
    var StageLookupProperties = 2;
    var StageCompleted = 99;
    var stage = StageLookupClassName;
    // Find the class name line which starts with "class"
    lines.forEach(function (line) {
        line = line.trim();
        switch (stage) {
            case StageLookupClassName:
                if (line.startsWith("enum ")) {
                    var enumName = line.substr(4).trimEnd(";").trim();
                    var codeEnum = new CodeEnum();
                    codeEnum.name = enumName;
                    enums.push(codeEnum);
                }
                else if (line.startsWith("class ")) {
                    if (String.isNullOrEmpty(codeClass.name)) {
                        codeClass.name = line.substr(5).trim();
                        stage = StageLookupClassBlock;
                    }
                }
                break;
            case StageLookupClassBlock:
                if (line.startsWith("{")) {
                    stage = StageLookupProperties;
                }
                break;
            case StageLookupProperties:
                if (line.startsWith("}")) {
                    stage = StageCompleted;
                }
                else {
                    line = line.trimEnd(";");
                    var pairs = line.split(" ");
                    var property = new CodeProperty();
                    pairs.forEach(function (p) {
                        if (!String.isNullOrEmpty(p)) {
                            if (String.isNullOrEmpty(property.type)) {
                                property.type = p;
                                if (p.toLowerCase().startsWith("list<")) {
                                    property.isList = true;
                                    property.listItemType = p.substr(4).trimStart("<").trimEnd(">");
                                }
                                property.typeWithoutList = property.isList ? property.listItemType : property.type;
                            }
                            else if (String.isNullOrEmpty(property.name)) {
                                property.name = p;
                                codeClass.properties.push(property);
                            }
                        }
                    });
                }
                break;
            case StageCompleted:
                break;
            default:
                break;
        }
    });
    return pseudoCode;
}
function buildCodeForCSharpServer(pseudoCode) {
    var supportEntityFramework = true;
    var codeClass = pseudoCode.codeClass;
    var builtinTypes = ["int", "long", "short", "guid", "bool", "float", "double", "byte", "char", "string", "datetime", "timespan", "decimal"];
    function isBuiltinType(typeName) {
        var typeName = typeName.toLowerCase();
        return builtinTypes.indexOf(typeName) >= 0;
    }
    var enumNames = [];
    pseudoCode.enums.forEach(function (e) {
        enumNames.push(e.name.toLowerCase());
    });
    function isEnum(typeName) {
        var typeName = typeName.toLowerCase();
        return enumNames.indexOf(typeName) >= 0;
        return false;
    }
    var indent1 = "    ";
    var indent2 = indent1 + indent1;
    var indent3 = indent2 + indent1;
    var sb = new StringBuilder();
    sb.appendLine("public class " + codeClass.name);
    sb.appendLine("{");
    // properties
    codeClass.properties.forEach(function (p) {
        if (supportEntityFramework) {
            var typeLower = p.type.toLowerCase();
            var nameLower = p.name.toLowerCase();
            if (nameLower === "id") {
                sb.appendLine(indent1 + "[Key]");
            }
            else if (typeLower == "string") {
                sb.appendLine(indent1 + "[Required(AllowEmptyStrings = true)]");
                sb.appendLine(indent1 + "[StringLength(1024)]");
            }
            else if ((!isBuiltinType(typeLower)) && (!isEnum(typeLower))) {
                sb.appendLine(indent1 + "[NotMapped]");
            }
        }
        sb.appendLine(indent1 + "public " + p.type + " " + p.name + " { get; set; }");
    });
    // Format class
    sb.appendLine();
    sb.appendLine(indent1 + "public class Format");
    sb.appendLine(indent1 + "{");
    codeClass.properties.forEach(function (p) {
        var formatType = (isBuiltinType(p.type) || isEnum(p.type)) ? "bool" : p.typeWithoutList + ".Format";
        sb.appendLine(indent2 + "public " + formatType + " " + p.name + " { get; set; }");
    });
    sb.appendLine(indent1 + "}");
    // Default constructor
    sb.appendLine();
    sb.appendLine(indent1 + "public " + codeClass.name + "()");
    sb.appendLine(indent1 + "{");
    sb.appendLine(indent1 + "}");
    // Constructor for db reader
    sb.appendLine();
    sb.append(indent1 + "public " + codeClass.name + "(DbDataReader reader");
    codeClass.properties.forEach(function (p) {
        sb.appendLine(",");
        sb.append(indent2 + "int " + camelNaming(p.name) + "Index = -1");
    });
    sb.appendLine(")");
    sb.appendLine(indent1 + "{");
    codeClass.properties.forEach(function (p) {
        if ((!isBuiltinType(p.type)) && (!isEnum(p.type))) {
            return;
        }
        var indexName = camelNaming(p.name) + "Index";
        sb.appendLine(indent2 + "if (" + indexName + " >= 0)");
        sb.appendLine(indent2 + "{");
        if (isBuiltinType(p.type)) {
            sb.appendLine(indent3 + p.name + " = (" + p.type + ")reader[" + indexName + "];");
        }
        else if (isEnum(p.type)) {
            sb.appendLine(indent3 + p.name + " = (" + p.type + ")(long)reader[" + indexName + "];");
        }
        sb.appendLine(indent2 + "}");
        sb.appendLine();
    });
    sb.appendLine(indent1 + "}");
    // Serialize method for object
    sb.appendLine();
    sb.appendLine(indent1 + "public static void Serialize(JsonWriter writer, " + codeClass.name + " item, Format format)");
    sb.appendLine(indent1 + "{");
    sb.appendLine(indent2 + "writer.WriteStartObject();");
    sb.appendLine();
    codeClass.properties.forEach(function (p) {
        if (isBuiltinType(p.type)) {
            sb.appendLine(indent2 + "if (format." + p.name + ")");
            sb.appendLine(indent2 + "{");
            sb.appendLine(indent3 + "writer.Write(\"" + p.name + "\", item." + p.name + ");");
            sb.appendLine(indent2 + "}");
        }
        else if (isEnum(p.type)) {
            sb.appendLine(indent2 + "if (format." + p.name + ")");
            sb.appendLine(indent2 + "{");
            sb.appendLine(indent3 + "writer.Write(\"" + p.name + "\", (long)item." + p.name + ");");
            sb.appendLine(indent2 + "}");
        }
        else {
            sb.appendLine(indent2 + "if ((format." + p.name + " != null) && (item." + p.name + " != null))");
            sb.appendLine(indent2 + "{");
            sb.appendLine(indent3 + "writer.WriteName(\"" + p.name + "\");");
            sb.appendLine(indent3 + p.typeWithoutList + ".Serialize(writer, item." + p.name + ", format." + p.name + ");");
            sb.appendLine(indent2 + "}");
        }
        sb.appendLine();
    });
    sb.appendLine(indent2 + "writer.WriteEndObject();");
    sb.appendLine(indent1 + "}");
    // Serialize method for array
    sb.appendLine();
    sb.appendLine(indent1 + "public static void Serialize(JsonWriter writer, IList<" + codeClass.name + "> list, Format format)");
    sb.appendLine(indent1 + "{");
    sb.appendLine(indent2 + "writer.WriteStartArray();");
    sb.appendLine();
    sb.appendLine(indent2 + "foreach (var item in list)");
    sb.appendLine(indent2 + "{");
    sb.appendLine(indent3 + "Serialize(writer, item, format);");
    sb.appendLine(indent2 + "}");
    sb.appendLine();
    sb.appendLine(indent2 + "writer.WriteEndArray();");
    sb.appendLine(indent1 + "}");
    // Deserialize method for object
    sb.appendLine();
    sb.appendLine(indent1 + "public static " + codeClass.name + " Deserialize(JsonObject json)");
    sb.appendLine(indent1 + "{");
    sb.appendLine(indent2 + "var item = new " + codeClass.name + "()");
    sb.appendLine(indent2 + "{");
    codeClass.properties.forEach(function (p) {
        if (isBuiltinType(p.type)) {
            var jsonParseMethod = "";
            switch (p.type.toLowerCase()) {
                case "int":
                    jsonParseMethod = "GetIntValue";
                    break;
                case "long":
                    jsonParseMethod = "GetLongValue";
                    break;
                case "datetime":
                    jsonParseMethod = "GetDateTimeValue";
                    break;
                case "float":
                    jsonParseMethod = "GetFloatValue";
                    break;
                case "double":
                    jsonParseMethod = "GetDoubleValue";
                    break;
                case "string":
                    jsonParseMethod = "GetStringValue";
                    break;
                case "byte":
                    jsonParseMethod = "GetByteValue";
                    break;
                case "char":
                    jsonParseMethod = "GetCharValue";
                    break;
                case "bool":
                    jsonParseMethod = "GetBooleanValue";
                    break;
                case "timespan":
                    jsonParseMethod = "GetTimeSpanValue";
                    break;
                case "guid":
                    jsonParseMethod = "GetGuidValue";
                    break;
            }
            sb.appendLine(indent3 + p.name + " = json." + jsonParseMethod + "(\"" + p.name + "\"),");
        }
        else if (isEnum(p.type)) {
            sb.appendLine(indent3 + p.name + " = (" + p.type + ")json.GetLongValue(\"" + p.name + "\", (long)" + p.type + ".DefaultValue),");
        }
        else {
        }
    });
    sb.appendLine(indent2 + "};");
    sb.appendLine();
    codeClass.properties.forEach(function (p) {
        if (isBuiltinType(p.type)) {
        }
        else if (isEnum(p.type)) {
        }
        else {
            var jsonName = camelNaming(p.name) + "Json";
            if (p.isList) {
                sb.appendLine(indent2 + "var " + jsonName + " = json.GetJsonArray(\"" + p.name + "\");");
            }
            else {
                sb.appendLine(indent2 + "var " + jsonName + " = json.GetJsonObject(\"" + p.name + "\");");
            }
            sb.appendLine(indent2 + "if (" + jsonName + " != null)");
            sb.appendLine(indent2 + "{");
            sb.appendLine(indent3 + "item." + p.name + " = " + p.typeWithoutList + ".Deserialize(" + jsonName + ");");
            sb.appendLine(indent2 + "}");
        }
    });
    sb.appendLine(indent2 + "return item;");
    sb.appendLine(indent1 + "}");
    // Deserialize method for array
    sb.appendLine();
    sb.appendLine(indent1 + "public static List<" + codeClass.name + "> Deserialize(JsonArray jsonArray)");
    sb.appendLine(indent1 + "{");
    sb.appendLine(indent2 + "var list = new List<" + codeClass.name + ">();");
    sb.appendLine();
    sb.appendLine(indent2 + "foreach (JsonObject json in jsonArray)");
    sb.appendLine(indent2 + "{");
    sb.appendLine(indent3 + "list.Add(Deserialize(json));");
    sb.appendLine(indent2 + "}");
    sb.appendLine();
    sb.appendLine(indent2 + "return list;");
    sb.appendLine(indent1 + "}");
    sb.appendLine("}");
    sb.appendLine();
    return sb.toString();
}
function generateCode(codeString) {
    var pseudoCode = parseCode(codeString);
    var finalCode = buildCodeForCSharpServer(pseudoCode);
    $("#GeneratedCode").val(finalCode);
    finalCode = finalCode.replaceAll("&", "&amp;");
    finalCode = finalCode.replaceAll(" ", "&nbsp;");
    finalCode = finalCode.replaceAll("<", "&lt;");
    finalCode = finalCode.replaceAll(">", "&gt;");
    finalCode = finalCode.replaceAll("\r\n", "<br>");
    var preview = $("#preview");
    preview.html(finalCode);
    $('pre code').each(function (i, block) {
        hljs.highlightBlock(block);
    });
}
$(document).ready(function () {
    $("#CopyButton").click(function () {
        if (window.clipboardData) {
            var generatedCode = $("#GeneratedCode").val();
            generatedCode = generatedCode.replaceAll("\n", "\r\n");
            window.clipboardData.setData("Text", generatedCode);
            $("#CopiedLabel").fadeIn(0);
            $("#CopiedLabel").fadeOut(500);
        }
    });
    var previous = "";
    window.setInterval(function () {
        var current = $("#CodeEditor").text();
        if (current !== previous) {
            previous = current;
            generateCode(current);
        }
    }, 2000);
});
//# sourceMappingURL=app.js.map
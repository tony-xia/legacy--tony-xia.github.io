var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var CodeEnum = (function () {
    function CodeEnum() {
        this.name = "";
    }
    return CodeEnum;
}());
var CodeClass = (function () {
    function CodeClass() {
        this.name = "";
        this.properties = [];
    }
    return CodeClass;
}());
var CodeProperty = (function () {
    function CodeProperty() {
        this.type = "";
        this.typeWithoutList = "";
        this.name = "";
        this.isList = false;
        this.listItemType = "";
    }
    return CodeProperty;
}());
var CodeUrlPart = (function () {
    function CodeUrlPart() {
    }
    return CodeUrlPart;
}());
var CodeUrlParameter = (function (_super) {
    __extends(CodeUrlParameter, _super);
    function CodeUrlParameter() {
        _super.apply(this, arguments);
        this.type = "";
        this.name = "";
    }
    return CodeUrlParameter;
}(CodeUrlPart));
var CodeUrlPlain = (function (_super) {
    __extends(CodeUrlPlain, _super);
    function CodeUrlPlain() {
        _super.apply(this, arguments);
        this.plainUrl = "";
    }
    return CodeUrlPlain;
}(CodeUrlPart));
var CodeInvoke = (function () {
    function CodeInvoke() {
        this.name = "";
        this.urlPath = [];
        this.urlQueryString = [];
        this.method = "GET";
        this.needAccessToken = false;
        this.requestBody = [];
        this.responseBody = [];
    }
    return CodeInvoke;
}());
var PseudoCode = (function () {
    function PseudoCode() {
        this.codeClass = new CodeClass();
        this.codeInvoke = new CodeInvoke();
        this.enums = [];
    }
    return PseudoCode;
}());
function camelNaming(name) {
    var nameLower = name.toLowerCase();
    if (name.length <= 1) {
        return nameLower;
    }
    else {
        return nameLower.substr(0, 1) + name.substr(1);
    }
}
function padRight(propertyType, Length, padSymbol) {
    if (propertyType.length < Length) {
        var differNumber = Length - propertyType.length;
        for (var i = 0; i < differNumber; i++) {
            propertyType += padSymbol;
        }
    }
    return propertyType;
}
function parseCode(pseudoCodeString) {
    pseudoCodeString = pseudoCodeString.replaceAll("\r", "");
    var lines = pseudoCodeString.split("\n");
    var pseudoCode = new PseudoCode();
    var codeClass = pseudoCode.codeClass;
    var codeInvoke = pseudoCode.codeInvoke;
    var enums = pseudoCode.enums;
    var StageLookupClassOrInvokeName = 0;
    var StageLookupClassBlock = 1;
    var StageLookupClassProperties = 2;
    var StageLookupInvokeBlock = 11;
    var StageLookupInvokeProperties = 12;
    var StageLookupInvokeRequestBodyProperties = 13;
    var StageLookupInvokeResponseBodyProperties = 14;
    var StageCompleted = 99;
    var stage = StageLookupClassOrInvokeName;
    // Find the class name line which starts with "class"
    lines.forEach(function (line) {
        var commentsIndex = line.indexOf('//');
        if (commentsIndex > 0) {
            line = line.substr(0, commentsIndex);
        }
        line = line.trim();
        switch (stage) {
            case StageLookupClassOrInvokeName:
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
                else if (line.startsWith("invokeitem ")) {
                    if (String.isNullOrEmpty(codeInvoke.name)) {
                        codeInvoke.name = line.substr(10).trim();
                        stage = StageLookupInvokeBlock;
                    }
                }
                break;
            case StageLookupClassBlock:
                if (line.startsWith("{")) {
                    stage = StageLookupClassProperties;
                }
                break;
            case StageLookupClassProperties:
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
            case StageLookupInvokeBlock:
                if (line.startsWith("{")) {
                    stage = StageLookupInvokeProperties;
                }
                break;
            case StageLookupInvokeProperties:
                if (line.startsWith("}")) {
                    stage = StageCompleted;
                }
                else {
                    line = line.trimEnd(";");
                    var assignmentIndex = line.indexOf("=");
                    var colonIndex = line.indexOf(":");
                    // get the min of positive numbers
                    assignmentIndex = (assignmentIndex < 0) ? 999 : assignmentIndex;
                    colonIndex = (colonIndex < 0) ? 999 : colonIndex;
                    var splitterIndex = Math.min(assignmentIndex, colonIndex);
                    if (splitterIndex != 999) {
                        var pairs_1 = [];
                        if (splitterIndex < (line.length - 1)) {
                            pairs_1.push(line.substr(0, splitterIndex));
                            pairs_1.push(line.substr(splitterIndex + 1));
                        }
                        else {
                            pairs_1.push(line);
                        }
                        if (pairs_1.length === 2) {
                            var propertyName = pairs_1[0].trim().toLowerCase();
                            var propertyValue = pairs_1[1].trim();
                            switch (propertyName) {
                                case "method":
                                    codeInvoke.method = propertyValue.trim('"');
                                    break;
                                case "url":
                                    var url = propertyValue.trim('"');
                                    var urlPairs = url.split("?");
                                    if (urlPairs.length === 2) {
                                        var urlPath = urlPairs[0];
                                        var urlQueryString = urlPairs[1];
                                        codeInvoke.urlPath = parseUrlParts(urlPath);
                                        codeInvoke.urlQueryString = parseUrlParts(urlQueryString);
                                    }
                                    else {
                                        codeInvoke.urlPath = parseUrlParts(urlPairs[0]);
                                        codeInvoke.urlQueryString = [];
                                    }
                                    break;
                                case "requestbody":
                                    stage = StageLookupInvokeRequestBodyProperties;
                                    break;
                                case "responsebody":
                                    stage = StageLookupInvokeResponseBodyProperties;
                                    break;
                                case "needaccesstoken":
                                    codeInvoke.needAccessToken = (propertyValue.toLowerCase() === "true");
                                    break;
                            }
                        }
                    }
                }
                break;
            case StageLookupInvokeRequestBodyProperties:
                if (line.startsWith("}")) {
                    stage = StageLookupInvokeProperties;
                }
                else {
                    line = line.trimEnd(";");
                    var pairs = line.split(":");
                    var property = new CodeProperty();
                    pairs.forEach(function (p) {
                        p = p.trim();
                        if (!String.isNullOrEmpty(p)) {
                            if (String.isNullOrEmpty(property.name)) {
                                property.name = p;
                                codeInvoke.requestBody.push(property);
                            }
                            else if (String.isNullOrEmpty(property.type)) {
                                property.type = p;
                                if (p.toLowerCase().startsWith("list<")) {
                                    property.isList = true;
                                    property.listItemType = p.substr(4).trimStart("<").trimEnd(">");
                                }
                                property.typeWithoutList = property.isList ? property.listItemType : property.type;
                            }
                        }
                    });
                }
                break;
            case StageLookupInvokeResponseBodyProperties:
                if (line.startsWith("}")) {
                    stage = StageLookupInvokeProperties;
                }
                else {
                    line = line.trimEnd(";");
                    var pairs = line.split(":");
                    var property = new CodeProperty();
                    pairs.forEach(function (p) {
                        p = p.trim();
                        if (!String.isNullOrEmpty(p)) {
                            if (String.isNullOrEmpty(property.name)) {
                                property.name = p;
                                codeInvoke.responseBody.push(property);
                            }
                            else if (String.isNullOrEmpty(property.type)) {
                                property.type = p;
                                if (p.toLowerCase().startsWith("list<")) {
                                    property.isList = true;
                                    property.listItemType = p.substr(4).trimStart("<").trimEnd(">");
                                }
                                property.typeWithoutList = property.isList ? property.listItemType : property.type;
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
function parseUrlParts(url) {
    var parts = [];
    var left = url;
    while (true) {
        var start = left.indexOf("{");
        if (start < 0) {
            break;
        }
        var end = left.indexOf("}", start);
        if (end <= 0) {
            break;
        }
        var plainPart = new CodeUrlPlain();
        plainPart.plainUrl = left.substr(0, start);
        parts.push(plainPart);
        var parameterString = left.substr(start + 1, end - start - 1);
        var parameterPairs = parameterString.split(":");
        if (parameterPairs.length == 2) {
            var parameterPart = new CodeUrlParameter();
            parameterPart.name = parameterPairs[0].trim();
            parameterPart.type = parameterPairs[1].trim();
            parts.push(parameterPart);
        }
        left = left.substr(end + 1);
    }
    if (!String.isNullOrEmpty(left)) {
        var lastPart = new CodeUrlPlain();
        lastPart.plainUrl = left;
        parts.push(lastPart);
    }
    return parts;
}
function generateCode(codeString, language) {
    var finalCode = "";
    var build;
    var preview = $("#preview");
    var pseudoCode = parseCode(codeString);
    switch (language) {
        case "C#":
            build = new CodeCSharp();
            preview.removeClass("objectivec").removeClass("java").removeClass("typescript").addClass("cs");
            break;
        case "Objective-C":
            build = new CodeObjectiveC();
            preview.removeClass("java").removeClass("cs").removeClass("typescript").addClass("objectivec");
            break;
        case "Java":
            build = new CodeJava();
            preview.removeClass("objectivec").removeClass("cs").removeClass("typescript").addClass("java");
            break;
        case "TypeScript":
            build = new CodeTypeScript();
            preview.removeClass("objectivec").removeClass("cs").removeClass("java").addClass("typescript");
            break;
        default:
            alert("Error Type");
            break;
    }
    finalCode = build.buildCode(pseudoCode);
    $("#GeneratedCode").val(finalCode);
    $("#CopyButton").attr("data-clipboard-text", finalCode);
    finalCode = finalCode.replaceAll("&", "&amp;");
    finalCode = finalCode.replaceAll(" ", "&nbsp;");
    finalCode = finalCode.replaceAll("<", "&lt;");
    finalCode = finalCode.replaceAll(">", "&gt;");
    finalCode = finalCode.replaceAll("\r\n", "<br>");
    preview.html(finalCode);
    $('pre code').each(function (i, block) {
        hljs.highlightBlock(block);
    });
}
function UpdateToEntitySample() {
    var sample = "enum Importance;\r\n"
        + "enum Status;\r\n"
        + "class Person\r\n"
        + "{\r\n"
        + "    Guid Id;\r\n"
        + "    string Name;\r\n"
        + "    Importance Importance;\r\n"
        + "    Status Status;\r\n"
        + "    DateTime Birthday;\r\n"
        + "    TimeSpan Timestamp;\r\n"
        + "    List <Person> Parents;\r\n"
        + "}";
    $("#CodeEditor").val(sample);
}
function UpdateToInvokeSample() {
    var sample = "enum Importance;\r\n"
        + "enum Status;\r\n"
        + "invokeitem CreatePerson\r\n"
        + "{\r\n"
        + "    Method = \"POST\";\r\n"
        + "    Url = \"Corporations/{corporationId: Guid}/Create?ownerId={userId: Guid}\";\r\n"
        + "    RequestBody: {\r\n"
        + "        User: Person;\r\n"
        + "        UserImportance: Importance;\r\n"
        + "    };\r\n"
        + "    ResponseBody: {\r\n"
        + "        Person: Person;\r\n"
        + "        UserStatus: Status;\r\n"
        + "    };\r\n"
        + "}";
    $("#CodeEditor").val(sample);
}
$(document).ready(function () {
    var previous = "";
    var previousLanguage = "";
    $("#SampleEntityButton").on("click", function () {
        if (confirm("Refresh to Entity sample code?")) {
            UpdateToEntitySample();
        }
    });
    $("#SampleInvokeButton").on("click", function () {
        if (confirm("Refresh to Invoke sample code?")) {
            UpdateToInvokeSample();
        }
    });
    UpdateToEntitySample();
    window.setInterval(function () {
        var currentLanguage = $("#language").children('option:selected').val();
        var current = $("#CodeEditor").val();
        if (current !== previous || previousLanguage !== currentLanguage) {
            previous = current;
            previousLanguage = currentLanguage;
            generateCode(current, currentLanguage);
        }
    }, 2000);
});
var CodeCSharp = (function () {
    function CodeCSharp() {
    }
    CodeCSharp.prototype.buildCode = function (pseudoCode) {
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
    };
    return CodeCSharp;
}());
var CodeObjectiveC = (function () {
    function CodeObjectiveC() {
    }
    CodeObjectiveC.prototype.buildCode = function (pseudoCode) {
        var codeOCClass = pseudoCode.codeClass;
        var builtinTypes = ["int", "long", "short", "guid", "bool", "float", "double", "byte", "char", "string", "datetime", "timespan", "decimal"];
        var enumNames = [];
        pseudoCode.enums.forEach(function (e) {
            enumNames.push(e.name.toLowerCase());
        });
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
        }
        var indent1 = "    ";
        var indent2 = indent1 + indent1;
        var indent3 = indent2 + indent1;
        var sb = new StringBuilder();
        sb.appendLine("@interface " + codeOCClass.name + " : NSObject");
        sb.appendLine("");
        // properties definition
        codeOCClass.properties.forEach(function (p) {
            if (isBuiltinType(p.type)) {
                if (p.name === "Id") {
                    switch (p.type.toLowerCase()) {
                        case "int":
                            sb.appendLine("@property (nonatomic, assign) " + padRight(p.type, 15, " ") + camelNaming(codeOCClass.name) + p.name);
                            break;
                        case "string":
                            sb.appendLine("@property (nonatomic, strong) " + padRight("NSString", 15, " ") + "*" + camelNaming(codeOCClass.name) + p.name);
                            break;
                        case "guid":
                            sb.appendLine("@property (nonatomic, strong) " + padRight(p.type, 15, " ") + "*" + camelNaming(codeOCClass.name) + p.name);
                            break;
                    }
                }
                else {
                    switch (p.type.toLowerCase()) {
                        case "int":
                            sb.appendLine("@property (nonatomic, assign) " + padRight(p.type, 15, " ") + camelNaming(p.name));
                            break;
                        case "long":
                            sb.appendLine("@property (nonatomic, assign) " + padRight(p.type, 15, " ") + camelNaming(p.name));
                            break;
                        case "timespan":
                        case "datetime":
                            sb.appendLine("@property (nonatomic, strong) " + padRight("NSDate", 15, " ") + "*" + camelNaming(p.name));
                            break;
                        case "float":
                            sb.appendLine("@property (nonatomic, assign) " + padRight("float", 15, " ") + camelNaming(p.name));
                            break;
                        case "double":
                            sb.appendLine("@property (nonatomic, assign) " + padRight("double", 15, " ") + camelNaming(p.name));
                            break;
                        case "string":
                            sb.appendLine("@property (nonatomic, strong) " + padRight("NSString", 15, " ") + "*" + camelNaming(p.name));
                            break;
                        case "byte":
                            sb.appendLine("@property (nonatomic, assign) " + padRight("byte", 15, " ") + camelNaming(p.name));
                            break;
                        case "char":
                            sb.appendLine("@property (nonatomic, assign) " + padRight("char", 15, " ") + camelNaming(p.name));
                            break;
                        case "boolean":
                        case "bool":
                            sb.appendLine("@property (nonatomic, assign) " + padRight("BOOL", 15, " ") + camelNaming(p.name));
                            break;
                        case "guid":
                            sb.appendLine("@property (nonatomic, strong) " + padRight(p.type, 15, " ") + "*" + camelNaming(p.name));
                            break;
                    }
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine("@property (nonatomic, assign) " + padRight(p.type, 15, " ") + camelNaming(p.name));
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine("@property (nonatomic, strong) " + padRight("NSArray", 15, " ") + "*" + camelNaming(p.name));
            }
            else {
            }
        });
        sb.appendLine("@property (nonatomic, assign) " + padRight(codeOCClass.name + "Format", 15, " ") + "*format");
        sb.appendLine();
        // Serialize method definition
        sb.appendLine("+ (NSDictionary *)serializeEntity:(" + codeOCClass.name + " *)entity");
        sb.appendLine("+ (NSArray *)serializeWithEntityArray:(NSArray *)entityArray");
        sb.appendLine();
        sb.appendLine("+ (" + codeOCClass.name + " *)deserializeFromDictionary:(NSDictionary *)dataDict");
        sb.appendLine("+ (NSArray *)deserializeFromDataArray:(NSArray *)dataArray");
        sb.appendLine();
        sb.appendLine("@end");
        sb.appendLine();
        // properties format definition
        sb.appendLine("@interface " + codeOCClass.name + "Format : NSObject");
        sb.appendLine();
        codeOCClass.properties.forEach(function (p) {
            if (p.name === "Id") {
                sb.appendLine("@property(nonatomic, assign) BOOL  " + camelNaming(codeOCClass.name) + "Id" + ";");
            }
            else {
                sb.appendLine("@property(nonatomic, assign) BOOL  " + camelNaming(p.name) + ";");
            }
        });
        sb.appendLine();
        sb.appendLine("- (void)confirmAll;");
        sb.appendLine();
        sb.appendLine("@end");
        sb.appendLine();
        sb.appendLine();
        // Serialize method for object
        sb.appendLine("@implementation " + codeOCClass.name);
        sb.appendLine();
        // four method
        // serializeEntity
        sb.appendLine("+ (NSDictionary *)serializeEntity:(" + codeOCClass.name + " *)entity");
        sb.appendLine("{");
        sb.appendLine(indent1 + "NSMutableDictionary *mDict = [NSMutableDictionary dictionary];");
        sb.appendLine();
        codeOCClass.properties.forEach(function (p) {
            if (isBuiltinType(p.type)) {
                if (p.name === "Id") {
                    switch (p.type.toLowerCase()) {
                        case "int":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(codeOCClass.name) + "Id && entity." + camelNaming(codeOCClass.name) + "Id) {");
                            sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = entity." + camelNaming(codeOCClass.name) + "Id" + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "string":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(codeOCClass.name) + "Id && entity." + camelNaming(codeOCClass.name) + "Id) {");
                            sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = entity." + camelNaming(codeOCClass.name) + "Id" + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "guid":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(codeOCClass.name) + "Id && entity." + camelNaming(codeOCClass.name) + "Id) {");
                            sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = entity." + camelNaming(codeOCClass.name) + "Id" + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                    }
                }
                else {
                    switch (p.type.toLowerCase()) {
                        case "int":
                        case "long":
                        case "float":
                        case "double":
                        case "byte":
                        case "char":
                        case "bool":
                        case "boolean":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(p.name) + " && entity." + camelNaming(p.name) + ") {");
                            sb.appendLine(indent2 + "mDict[@\"" + camelNaming(p.name) + "\"] = @(entity." + camelNaming(p.name) + ");");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "guid":
                            sb.appendLine(indent1 + "if(entity.format." + camelNaming(p.name));
                            sb.appendLine(indent2 + "mDict[@\"" + camelNaming(p.name) + "\"] = entity." + camelNaming(p.name) + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "timespan":
                        case "datetime":
                            sb.appendLine(indent1 + "if (entity.format." + camelNaming(p.name) + " && entity." + camelNaming(p.name) + ") {");
                            sb.appendLine(indent2 + "NSDateFormatter *formatter = [[NSDateFormatter alloc] init];");
                            sb.appendLine(indent2 + "formatter.dateFormat = @\"yyyy-MM-dd HH:mm:ss\";");
                            sb.appendLine(indent2 + "NSString *dateString = [formatter stringFromDate:entity." + p.name + "];");
                            sb.appendLine(indent3 + "mDict[@\"" + p.name + "\"] = dateString;");
                            sb.appendLine(indent2 + "}");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "string":
                            sb.appendLine(indent1 + "if (entity.format." + camelNaming(p.name) + " && entity." + camelNaming(p.name) + ") {");
                            sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = entity." + p.name + ";");
                            sb.appendLine(indent1 + "}");
                            break;
                    }
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent1 + "if(entity.format." + camelNaming(p.name) + ") {");
                sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = @(entity." + camelNaming(p.name) + ");");
                sb.appendLine(indent1 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "if (entity.format." + camelNaming(p.name) + " && " + "entity." + camelNaming(p.name) + ".count > 0) {");
                sb.appendLine(indent2 + "NSArray *array = [" + codeOCClass.name + " serializeWithEntityArray:entity." + p.name + "];");
                sb.appendLine(indent2 + "if (array) {");
                sb.appendLine(indent3 + "mDict[@\"" + p.name + "\"] = array;");
                sb.appendLine(indent2 + "}");
                sb.appendLine(indent1 + "}");
            }
            else {
                sb.appendLine(indent1 + "if (entity.format." + p.name + " && entity." + p.name + ") {");
                sb.appendLine(indent2 + "NSDictory *Dict = [" + p.type + "serializeEntity:entity." + p.name + "];");
                sb.appendLine(indent2 + "mDict[@\"" + p.name + "\"] = Dict;");
                sb.appendLine(indent1 + "}");
            }
        });
        sb.appendLine(indent1 + "return mDict.copy;");
        sb.appendLine("}");
        sb.appendLine();
        // serializeWithEntityArray
        sb.appendLine("+ (NSArray *)serializeWithEntityArray:(NSArray *)entityArray");
        sb.appendLine("{");
        sb.appendLine(indent1 + "NSMutableArray *mArray = [NSMutableArray array];");
        sb.appendLine(indent2 + "for (" + codeOCClass.name + " *entity in entityArray) {");
        sb.appendLine(indent3 + "NSDictionary *entityInfoDcit = [" + codeOCClass.name + " serializeEntity:entity];");
        sb.appendLine(indent3 + "if (entityInfoDict) {");
        sb.appendLine(indent3 + indent1 + "[mArray addObject:entityInfoDict];");
        sb.appendLine(indent3 + "}");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent1 + "return mArray.copy;");
        sb.appendLine("}");
        sb.appendLine();
        //deserializeFromDataArray
        sb.appendLine("+ (NSArray *)deserializeFromDataArray:(NSArray *)dataArray");
        sb.appendLine("{");
        sb.appendLine(indent1 + "NSMutableArray *mArray = [NSMutableArray array];");
        sb.appendLine(indent1 + "for (NSDictionary *entityInfoDict in dataArray) {");
        sb.appendLine(indent2 + codeOCClass.name + " *entity = [" + codeOCClass.name + " deserializeFromDictionary:entityInfoDict];");
        sb.appendLine(indent2 + "if (entity) {");
        sb.appendLine(indent3 + "[mArray addObject:entity];");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent1 + "}");
        sb.appendLine(indent1 + "return mArray.copy;");
        sb.appendLine("}");
        sb.appendLine();
        // deserializeFromDictionary
        sb.appendLine("+ (" + codeOCClass.name + " *)deserializeFromDictionary: (NSDictionary *)dataDict");
        sb.appendLine("{");
        sb.appendLine(indent1 + codeOCClass.name + " *entity = [[" + codeOCClass.name + " alloc] init];");
        sb.appendLine();
        var index = 1;
        codeOCClass.properties.forEach(function (p) {
            if (isBuiltinType(p.type)) {
                if (p.name === "Id") {
                    var propertyName = camelNaming(p.name) + Number;
                    switch (p.type.toLowerCase()) {
                        case "int":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + camelNaming(codeOCClass.name) + "Id\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + camelNaming(codeOCClass.name) + "Id = " + propertyName + ".intValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "string":
                            sb.appendLine(indent1 + "entity." + camelNaming(codeOCClass.name) + "Id = [dataDict stringForKey:@\"" + camelNaming(codeOCClass.name) + "Id\"]");
                            break;
                        case "guid":
                            sb.appendLine(indent1 + "entity." + camelNaming(codeOCClass.name) + "Id = [dataDict guidForKey:@\"" + camelNaming(codeOCClass.name) + "Id\"]");
                            break;
                    }
                }
                else {
                    switch (p.type.toLowerCase()) {
                        case "guid":
                            sb.appendLine(indent1 + "entity." + p.name + " = [dataDict guidForKey:@\"" + p.name + "\"]");
                            sb.appendLine();
                            break;
                        case "int":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".intValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "long":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".longValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "float":
                            sb.appendLine(indent1 + "NSNumber *" + propertyName + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + propertyName + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".floatValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "double":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".doubleValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "bool":
                        case "boolean":
                            sb.appendLine(indent1 + "NSNumber *" + camelNaming(propertyName) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                            sb.appendLine(indent1 + "if (" + camelNaming(propertyName) + ") {");
                            sb.appendLine(indent2 + "entity." + p.name + " = " + propertyName + ".boolValue;");
                            sb.appendLine(indent1 + "}");
                            break;
                        case "timespan":
                        case "datetime":
                            sb.appendLine(indent1 + "NSString *dateString = [dataDict stringForKey:@\"" + p.name + "\"];");
                            sb.appendLine(indent1 + "if (dateString) {");
                            sb.appendLine(indent2 + "NSDateFormatter *formatter = [[NSDateFormatter alloc] init];");
                            sb.appendLine(indent2 + "formatter.dateFormat = @\"yyyy-MM-dd HH:mm:ss\";");
                            sb.appendLine(indent2 + "entity." + p.name + " = [formatter dateFromString:dateString];");
                            sb.appendLine(indent1 + "}");
                            sb.appendLine();
                            break;
                        case "string":
                            sb.appendLine(indent1 + "entity." + p.name + " = [dataDict stringForKey:@\"" + p.name + "\"]");
                            sb.appendLine();
                            break;
                    }
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent1 + "NSNumber *" + camelNaming(p.name) + " = [dataDict numberForKey:@\"" + p.name + "\"]");
                sb.appendLine(indent1 + "if (" + camelNaming(p.name) + ") {");
                sb.appendLine(indent2 + "entity." + p.name + " = " + p.name + ".integetValue;");
                sb.appendLine(indent1 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "NSArray *array = [dataDict arrayForKey:@\"" + p.name + "\"];");
                sb.appendLine(indent1 + "if (array.count > 0) {");
                sb.appendLine(indent2 + "entity." + p.name + " = [" + codeOCClass.name + " deserializeFromDataArray:array];");
                sb.appendLine(indent1 + "}");
                sb.appendLine();
            }
            else {
                sb.appendLine(indent1 + "NSDictionary *Dict = [dataDict dictionaryForKey:@\"" + p.name + "\"];");
                sb.appendLine(indent1 + "if (Dict.count > 0) {");
                sb.appendLine(indent2 + "entity." + p.name + " = [" + p.type + " deserializeFromDictionary:Dict];");
                sb.appendLine(indent1 + "}");
            }
        });
        sb.appendLine(indent1 + "return entity;");
        sb.appendLine("}");
        sb.appendLine();
        sb.appendLine("@end");
        sb.appendLine();
        sb.appendLine();
        // properties format assignment
        sb.appendLine("@implementation " + codeOCClass.name + "Format");
        sb.appendLine();
        sb.appendLine("- (void)confirmAll");
        sb.appendLine("{");
        sb.appendLine();
        codeOCClass.properties.forEach(function (p) {
            if (p.name.indexOf("Id") > -1) {
                sb.appendLine(indent1 + "self." + camelNaming(codeOCClass.name) + "Id = YES;");
            }
            else {
                sb.appendLine(indent1 + "self." + camelNaming(p.name) + " = YES;");
            }
        });
        sb.appendLine("}");
        sb.appendLine();
        sb.appendLine("@end");
        return sb.toString();
    };
    return CodeObjectiveC;
}());
var CodeJava = (function () {
    function CodeJava() {
    }
    CodeJava.prototype.buildCode = function (pseudoCode) {
        var sb = new StringBuilder();
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
        }
        var indent1 = "    ";
        var indent2 = indent1 + indent1;
        var indent3 = indent2 + indent1;
        sb.appendLine("import android.common.Guid;");
        sb.appendLine("import android.common.json.JsonUtility;");
        sb.appendLine("import android.common.json.JsonWriter;");
        sb.appendLine("import android.os.Parcel;");
        sb.appendLine("import android.os.Parcelable;");
        sb.appendLine("import org.json.JSONArray;");
        sb.appendLine("import org.json.JSONObject;");
        sb.appendLine("import java.util.ArrayList;");
        sb.appendLine("import java.util.Date;");
        sb.appendLine("import java.util.List;");
        sb.appendLine();
        sb.appendLine();
        var codeJavaClass = pseudoCode.codeClass;
        sb.appendLine("public class " + codeJavaClass.name + " implements Parcelable {");
        sb.appendLine();
        codeJavaClass.properties.forEach(function (p) {
            if (p.type.indexOf("string") > -1) {
                sb.appendLine(indent1 + "private String " + p.name + ";");
            }
            sb.appendLine(indent1 + "private " + p.type + " " + p.name + ";");
        });
        sb.appendLine();
        sb.appendLine(indent1 + "public " + codeJavaClass.name + "() {");
        sb.appendLine(indent1 + "}");
        sb.appendLine();
        sb.appendLine(indent1 + "public class Format {");
        codeJavaClass.properties.forEach(function (p) {
            if (p.isList) {
                sb.appendLine(indent2 + "public " + codeJavaClass.name + ".Format " + p.name);
            }
            else if (isBuiltinType(p.type) || isEnum(p.type)) {
                sb.appendLine(indent2 + "public boolean " + p.name + ";");
            }
            else {
                sb.appendLine(indent2 + "public " + p.type + ".Format " + p.name);
            }
        });
        sb.appendLine("}");
        sb.appendLine();
        sb.appendLine(indent1 + "public " + codeJavaClass.name + "(Parcel in) {");
        codeJavaClass.properties.forEach(function (p) {
            if (isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + p.name + " = (Guid)in.readSerializeable();");
                        break;
                    case "int":
                        sb.appendLine(indent2 + p.name + " = in.readInt()");
                        break;
                    case "long":
                        sb.appendLine(indent2 + p.name + " = in.readLong();");
                        break;
                    case "float":
                        sb.appendLine(indent2 + p.name + " = in.readFloat();");
                        break;
                    case "double":
                        sb.appendLine(indent2 + p.name + " = in.readDouble();");
                        break;
                    case "string":
                        sb.appendLine(indent2 + p.name + " = in.readString();");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + p.name + " = in.readInt() == 0 ? false : true;");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + p.name + " = (Date)in.readSerializeable();");
                        break;
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent2 + p.name + " = " + p.name + ".ValueOf(in.readInt());");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + p.name + " = new ArrayList<>();");
                sb.appendLine(indent2 + "in.readTypedList(" + p.name + ", " + codeJavaClass.name + ".CREATOR" + ");");
            }
            else {
                sb.appendLine(indent2 + "in.readParcelable" + "(" + p.type + ".class.getClassLoader());");
            }
        });
        sb.appendLine(indent1 + "}");
        sb.appendLine();
        // @Override
        // writeToParcel
        sb.appendLine(indent1 + "@Override");
        sb.appendLine(indent1 + "public void writeToParcel(Parcel parcel, int flag) {");
        codeJavaClass.properties.forEach(function (p) {
            if (isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "parcel.writeSerializeable(" + p.name + ");");
                        break;
                    case "int":
                        sb.appendLine(indent2 + "parcel.writeInt(" + p.name + ");");
                        break;
                    case "long":
                        sb.appendLine(indent2 + "parcel.writeLong(" + p.name + ");");
                        break;
                    case "float":
                        sb.appendLine(indent2 + "parcel.writeFloat(" + p.name + ");");
                        break;
                    case "double":
                        sb.appendLine(indent2 + "parcel.writeDouble(" + p.name + ");");
                        break;
                    case "string":
                        sb.appendLine(indent2 + "parcel.writeString(" + p.name + ");");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "parcel.writeInt(" + p.name + " ? 0 : 1);");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "parcel.writeSerializeable(" + p.name + ");");
                        break;
                    default:
                        break;
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "parcel.writeInt(" + p.name + ".value());");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "parcel.writeTypedList(" + p.name + ");");
            }
            else {
                sb.appendLine(indent2 + "parcel.writeParcelable(" + p.type + ", flag);");
            }
        });
        sb.appendLine(indent1 + "}");
        // serializeObject
        sb.appendLine();
        sb.appendLine(indent1 + "public static void serializeObject(JsonWriter writer," + codeJavaClass.name + " entity, Format format) {");
        sb.appendLine(indent2 + "writer.beginObject()");
        codeJavaClass.properties.forEach(function (p) {
            if (isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value((entity." + p.name + " == null) ? Guid.empty : entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "int":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "long":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "float":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "double":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "string":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity.)" + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "if (format." + p.name + ") {");
                        sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(JsonUtility.DateToString(entity." + p.name + "));");
                        sb.appendLine(indent2 + "}");
                        break;
                    default:
                        break;
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "if (format." + p.name + ") {");
                sb.appendLine(indent3 + "write.name(\"" + p.name + "\").value(entity." + p.name + ".value());");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if ((format." + p.name + " != null) && (entity." + p.name + " != null)) {");
                sb.appendLine(indent3 + "write.name(\"" + p.name + "\");");
                sb.appendLine(indent3 + codeJavaClass.name + ".serializeArray(writer, entity.)" + p.name + ", format." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            else {
                sb.appendLine(indent2 + "if ((format." + p.type + " != null) && (entity." + p.type + " != null)) {");
                sb.appendLine(indent3 + "writer.name(\"" + p.type + "\"");
                sb.appendLine(indent3 + codeJavaClass.name + ".serializeObject(writer, entity." + p.name + ", format." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
        });
        sb.appendLine(indent2 + "writer.beginObject()");
        sb.appendLine(indent1 + "}");
        // deserializeObject
        sb.appendLine();
        sb.appendLine(indent1 + "public static " + codeJavaClass.name + " deserializeObject(JSONObject json) {");
        sb.appendLine(indent2 + codeJavaClass.name + " entity = new " + codeJavaClass.name + "()");
        sb.appendLine();
        codeJavaClass.properties.forEach(function (p) {
            if (isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "entity." + p.name + " = JsonUtility(json, \"" + p.name + "\")");
                        break;
                    case "int":
                        sb.appendLine(indent2 + "entity." + p.name + " = json.optInt(\"" + p.name + "\");");
                        break;
                    case "long":
                        sb.appendLine(indent2 + "entity." + p.name + " = json.optInt(\"" + p.name + "\");");
                        break;
                    case "float":
                        sb.appendLine(indent2 + "entity." + p.name + " = json.optInt(\"" + p.name + "\");");
                        break;
                    case "double":
                        sb.appendLine(indent2 + "entity." + p.name + " = json.optDouble(\"" + p.name + "\");");
                        break;
                    case "string":
                        sb.appendLine(indent2 + "entity." + p.name + " = json.optString(\"" + p.name + "\");");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "entity." + p.name + " = json.optBoolean(\"" + p.name + "\");");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "entity." + p.name + " = JsonUtility.optDate(json, \"" + p.name + "\");");
                        break;
                    default:
                        break;
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "if (json.has(\"" + p.name + "\")) {");
                sb.appendLine(indent3 + "entity." + p.name + " = " + p.type + ".valueOf(json.optInt(\"" + p.name + "\"));");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if (json.has(\"" + p.name + "\")) {");
                sb.appendLine(indent3 + "entity." + p.name + " = " + codeJavaClass.name + " deserializeArray(json.optJSONArray(\"" + p.name + "\"));");
                sb.appendLine(indent2 + "}");
            }
            else {
                sb.appendLine(indent2 + "if (json.has(\"" + p.name + "\")) {");
                sb.appendLine(indent3 + "entity." + p.name + " = " + p.type + "deserializeObject(json.optJSONObject(\"" + p.name + "\"));");
                sb.appendLine(indent2 + "}");
            }
        });
        sb.appendLine();
        sb.appendLine(indent2 + "return entity;");
        sb.appendLine(indent1 + "}");
        // serializeArray
        sb.appendLine();
        sb.appendLine(indent1 + "public static void serializeArray(JsonWriter writer, List<" + codeJavaClass.name + "> entity) {");
        sb.appendLine(indent2 + "writer.beginArray();");
        sb.appendLine(indent2 + "for (" + codeJavaClass.name + " item : list) {");
        sb.appendLine(indent3 + "serializeObject(writer, item, format);");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent2 + "writer.endArray();");
        sb.appendLine(indent1 + "}");
        // deserializeArray
        sb.appendLine();
        sb.appendLine(indent1 + "public static List<" + codeJavaClass.name + "> deserializeArray(JSONArray jsonArray) {");
        sb.appendLine(indent2 + "List<" + codeJavaClass.name + "> list = new ArrayList<>();");
        sb.appendLine(indent2 + "for (int i = 0; i < jsonArray.length(); i++) {");
        sb.appendLine(indent3 + "JSONObject json = jsonArray.optJSONObject(i);");
        sb.appendLine(indent3 + "list.add(deserializeObject(json));");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent2 + "return list;");
        sb.appendLine(indent1 + "}");
        sb.appendLine();
        sb.appendLine(indent1 + "public static final Creator<" + codeJavaClass.name + "> CREATOR = new Creator<" + codeJavaClass.name + ">() {");
        sb.appendLine(indent2 + "@override");
        sb.appendLine(indent2 + "public " + codeJavaClass.name + " createFromParcel(Parcel in) {");
        sb.appendLine(indent3 + "return new " + codeJavaClass.name + "(in)");
        sb.appendLine(indent2 + "}");
        sb.appendLine();
        sb.appendLine(indent2 + "@override");
        sb.appendLine(indent2 + "public " + codeJavaClass.name + "[] newArray(int size) {");
        sb.appendLine(indent3 + "return new " + codeJavaClass.name + "[size];");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent1 + "}");
        sb.appendLine();
        sb.appendLine(indent1 + "@override");
        sb.appendLine(indent1 + "public int describeContents() {");
        sb.appendLine(indent2 + "return 0;");
        sb.appendLine(indent1 + "}");
        sb.appendLine("}");
        return sb.toString();
    };
    return CodeJava;
}());
var CodeTypeScript = (function () {
    function CodeTypeScript() {
        this.enumNames = [];
    }
    CodeTypeScript.isBuiltinType = function (typeName) {
        return CodeTypeScript.builtinTypes.indexOf(typeName.toLowerCase()) >= 0;
    };
    CodeTypeScript.prototype.isEnum = function (typeName) {
        var typeName = typeName.toLowerCase();
        return this.enumNames.indexOf(typeName) >= 0;
    };
    CodeTypeScript.prototype.buildCode = function (pseudoCode) {
        var _this = this;
        pseudoCode.enums.forEach(function (e) {
            _this.enumNames.push(e.name.toLowerCase());
        });
        var sb = new StringBuilder();
        if (!String.isNullOrEmpty(pseudoCode.codeClass.name)) {
            this.buildCodeClass(pseudoCode, sb);
        }
        else {
            this.buildCodeInvoke(pseudoCode, sb);
        }
        return sb.toString();
    };
    CodeTypeScript.prototype.buildCodeClass = function (pseudoCode, sb) {
        var indent1 = "    ";
        var indent2 = indent1 + indent1;
        var indent3 = indent2 + indent1;
        var codeTsClass = pseudoCode.codeClass;
        var enumNames = [];
        pseudoCode.enums.forEach(function (e) {
            enumNames.push(e.name.toLowerCase());
        });
        function isEnum(typeName) {
            var typeName = typeName.toLowerCase();
            return enumNames.indexOf(typeName) >= 0;
        }
        sb.appendLine("export class " + codeTsClass.name + " {");
        codeTsClass.properties.forEach(function (p) {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Guid = Guid.empty;");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": number = 0;");
                        break;
                    case "string":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": string = \"\";");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": boolean = false;");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Date = Date.empty;");
                        break;
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.type + " = " + p.type + ".Default;");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Array<" + p.listItemType + "> = null;");
            }
            else {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.type + " = null;");
            }
        });
        sb.appendLine();
        sb.appendLine(indent1 + "public static serializeEntity(writer: JsonWriter, entity: " + codeTsClass.name + ", format: " + codeTsClass.name + "Format): void {");
        sb.appendLine(indent2 + "writer.writeStartObject();");
        codeTsClass.properties.forEach(function (p) {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                        sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        break;
                    case "string":
                        sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                        sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                        sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                        sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "if (format." + camelNaming(p.name) + ") {");
                sb.appendLine(indent3 + "writer.write(\"" + p.name + "\", entity." + camelNaming(p.name) + ");");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if ((format." + camelNaming(p.name) + ") && (entity." + camelNaming(p.name) + ")) {");
                sb.appendLine(indent3 + "writer.writeName(\"" + p.name + "\");");
                sb.appendLine(indent3 + p.typeWithoutList + ".serializeEntities(writer, entity." + camelNaming(p.name) + ", format." + camelNaming(p.name) + ");");
                sb.appendLine(indent2 + "}");
            }
            else {
                sb.appendLine(indent2 + "if ((format." + camelNaming(p.name) + ") && (entity." + camelNaming(p.name) + ")) {");
                sb.appendLine(indent3 + "writer.writeName(\"" + p.name + "\");");
                sb.appendLine(indent3 + p.typeWithoutList + ".serializeEntity(writer, entity." + camelNaming(p.name) + ", format." + camelNaming(p.name) + ");");
                sb.appendLine(indent2 + "}");
            }
        });
        sb.appendLine(indent2 + " writer.writeEndObject();");
        sb.appendLine(indent1 + "}");
        sb.appendLine();
        //serializeEntities
        sb.appendLine(indent1 + "public static serializeEntities(writer: JsonWriter, entities: Array<" + codeTsClass.name + ">, format: " + codeTsClass.name + "Format): void {");
        sb.appendLine(indent2 + "writer.writeStartArray();");
        sb.appendLine(indent2 + "entities.forEach(entity => {");
        sb.appendLine(indent3 + codeTsClass.name + ".serializeEntity(writer, entity, format);");
        sb.appendLine(indent2 + "});");
        sb.appendLine(indent2 + "writer.writeEndArray();");
        sb.appendLine(indent1 + "}");
        // deserializeEntity
        sb.appendLine();
        sb.appendLine(indent1 + "public static deserializeEntity(jsonObject: any): " + codeTsClass.name + " {");
        sb.appendLine(indent2 + "let entity = new " + codeTsClass.name + "();");
        codeTsClass.properties.forEach(function (p) {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "if((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = Guid.parse(jsonObject." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "string":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = new Date(Date.parse(jsonObject." + p.name + "));");
                        sb.appendLine(indent2 + "}");
                        break;
                }
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = <" + p.type + ">(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = " + p.typeWithoutList + ".deserializeEntities(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            else {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "entity." + camelNaming(p.name) + " = " + p.typeWithoutList + ".deserializeEntity(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
        });
        sb.appendLine(indent2 + "return entity;");
        sb.appendLine(indent1 + "}");
        // deserializeEntities
        sb.appendLine();
        sb.appendLine(indent1 + "public static deserializeEntities(jsonArray: any[]): Array<" + codeTsClass.name + "> {");
        sb.appendLine(indent2 + "let entities = new Array<" + codeTsClass.name + ">();");
        sb.appendLine(indent2 + "let count = jsonArray.length;");
        sb.appendLine(indent2 + "for (let i = 0; i < count; i++) {");
        sb.appendLine(indent3 + "let entity = " + codeTsClass.name + ".deserializeEntity(jsonArray[i]);");
        sb.appendLine(indent3 + "entities.push(entity);");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent2 + "return entities;");
        sb.appendLine(indent1 + "}");
        sb.appendLine("}");
        sb.appendLine();
        sb.appendLine("export class " + codeTsClass.name + "Format {");
        codeTsClass.properties.forEach(function (p) {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": boolean = false;");
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": boolean = false;");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.typeWithoutList + "Format = null;");
            }
            else {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.typeWithoutList + "Format = null;");
            }
        });
        sb.appendLine(indent1 + "public constructor(defaultValue: boolean = false) {");
        sb.appendLine(indent2 + "if (defaultValue) {");
        codeTsClass.properties.forEach(function (p) {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                sb.appendLine(indent3 + "this." + camelNaming(p.name) + " = defaultValue;");
            }
            else if (isEnum(p.type)) {
                sb.appendLine(indent3 + "this." + camelNaming(p.name) + " = defaultValue;");
            }
            else if (p.type.indexOf("List") > -1) {
            }
            else {
            }
        });
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent1 + "}");
        sb.appendLine("}");
    };
    CodeTypeScript.prototype.buildCodeInvoke = function (pseudoCode, sb) {
        var _this = this;
        var indent1 = "    ";
        var indent2 = indent1 + indent1;
        var indent3 = indent2 + indent1;
        var invokeItem = pseudoCode.codeInvoke;
        sb.appendLine("export class " + invokeItem.name + "Invoke extends BaseInvoke {");
        sb.appendLine(indent1 + "public result: " + invokeItem.name + "InvokeResult = null;");
        // constructor
        sb.append(indent1 + "public constructor(");
        var allUrlParts = [];
        allUrlParts.pushRange(invokeItem.urlPath);
        allUrlParts.pushRange(invokeItem.urlQueryString);
        var isFirstParameterPart = true;
        allUrlParts.forEach(function (part) {
            if (part instanceof CodeUrlPlain) {
                return;
            }
            if (!isFirstParameterPart) {
                sb.append(", ");
            }
            else {
                isFirstParameterPart = false;
            }
            var p = part;
            var definition = _this.buildDefinition(p.type, p.name);
            sb.append(definition);
        });
        invokeItem.requestBody.forEach(function (p) {
            if (!isFirstParameterPart) {
                sb.append(", ");
            }
            else {
                isFirstParameterPart = false;
            }
            var definition = _this.buildDefinition(p.type, camelNaming(p.name));
            sb.append(definition);
            if ((!CodeTypeScript.isBuiltinType(p.type)) && (!_this.isEnum(p.type))) {
                sb.append(", ");
                sb.append(camelNaming(p.name) + "Format: " + p.typeWithoutList + "Format");
            }
        });
        sb.appendLine(") {");
        sb.appendLine(indent2 + "super();");
        sb.appendLine(indent2 + "this.method = \"" + invokeItem.method + "\";");
        sb.appendLine(indent2 + "this.needAccessToken = " + (invokeItem.needAccessToken ? "true" : "false") + ";");
        sb.append(indent2 + "this.relativeUrl = `");
        invokeItem.urlPath.forEach(function (part) {
            if (part instanceof CodeUrlPlain) {
                sb.append(part.plainUrl);
                return;
            }
            sb.append("${");
            var p = part;
            sb.append(_this.buildToString(p.type, p.name));
            sb.append("}");
        });
        if (invokeItem.urlQueryString.length > 0) {
            sb.append("?");
        }
        invokeItem.urlQueryString.forEach(function (part) {
            if (part instanceof CodeUrlPlain) {
                sb.append(part.plainUrl);
                return;
            }
            sb.append("${");
            var p = part;
            sb.append(_this.buildToString(p.type, p.name));
            sb.append("}");
        });
        sb.appendLine("`;");
        if (invokeItem.requestBody.length > 0) {
            sb.appendLine();
            sb.appendLine(indent2 + "let writer = new JsonWriter();");
            sb.appendLine(indent2 + "writer.writeStartObject();");
            invokeItem.requestBody.forEach(function (p) {
                var name = p.name;
                var camelName = camelNaming(name);
                if (CodeTypeScript.isBuiltinType(p.type)) {
                    switch (p.type.toLocaleLowerCase()) {
                        case "guid":
                        case "int":
                        case "long":
                        case "float":
                        case "double":
                        case "string":
                        case "boolean":
                        case "bool":
                        case "date":
                        case "timespan":
                        case "datetime":
                            sb.appendLine(indent2 + "writer.write(\"" + name + "\", " + camelName + ");");
                            break;
                    }
                }
                else if (_this.isEnum(p.type)) {
                    sb.appendLine(indent2 + "writer.write(\"" + name + "\", " + camelName + ");");
                }
                else if (p.type.indexOf("List") > -1) {
                    sb.appendLine(indent2 + "writer.writeName(\"" + name + "\");");
                    sb.appendLine(indent2 + p.listItemType + ".serializeEntities(writer, " + camelName + ", " + camelName + "Format);");
                }
                else {
                    sb.appendLine(indent2 + "writer.writeName(\"" + name + "\");");
                    sb.appendLine(indent2 + name + ".serializeEntity(writer, " + camelName + ", " + camelName + "Format);");
                }
            });
            sb.appendLine(indent2 + "writer.writeEndObject();");
            sb.appendLine(indent2 + "this.requestBodyJson = writer.getRaw();");
        }
        sb.appendLine(indent1 + "}");
        sb.appendLine();
        sb.appendLine(indent1 + "public postInvoke(code: number): void {");
        sb.appendLine(indent2 + "if (code < 0) {");
        sb.appendLine(indent3 + "return;");
        sb.appendLine(indent2 + "}");
        sb.appendLine(indent2 + "this.result = " + invokeItem.name + "InvokeResult.deserialize(this.responseBodyJson);");
        sb.appendLine(indent1 + "}");
        sb.appendLine("}");
        sb.appendLine();
        this.buildCodeInvokeResultClass(pseudoCode, sb);
    };
    CodeTypeScript.prototype.buildCodeInvokeResultClass = function (pseudoCode, sb) {
        var _this = this;
        var indent1 = "    ";
        var indent2 = indent1 + indent1;
        var indent3 = indent2 + indent1;
        var codeInvoke = pseudoCode.codeInvoke;
        var resultClassName = codeInvoke.name + "InvokeResult";
        sb.appendLine("export class " + resultClassName + " extends BaseInvokeResult {");
        codeInvoke.responseBody.forEach(function (p) {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Guid = Guid.empty;");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": number = 0;");
                        break;
                    case "string":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": string = \"\";");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": boolean = false;");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Date = Date.empty;");
                        break;
                }
            }
            else if (_this.isEnum(p.type)) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.type + " = " + p.type + ".Default;");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": Array<" + p.listItemType + "> = null;");
            }
            else {
                sb.appendLine(indent1 + "public " + camelNaming(p.name) + ": " + p.listItemType + " = null;");
            }
        });
        sb.appendLine();
        // deserializeEntity
        sb.appendLine();
        sb.appendLine(indent1 + "public static deserialize(jsonObject: any): " + resultClassName + " {");
        sb.appendLine(indent2 + "let result = new " + resultClassName + "();");
        sb.appendLine(indent2 + "result.deserializeBasicInfo(jsonObject);");
        codeInvoke.responseBody.forEach(function (p) {
            if (CodeTypeScript.isBuiltinType(p.type)) {
                switch (p.type.toLocaleLowerCase()) {
                    case "guid":
                        sb.appendLine(indent2 + "if((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "result." + camelNaming(p.name) + " = Guid.parse(jsonObject." + p.name + ");");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "int":
                    case "long":
                    case "float":
                    case "double":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "result." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "string":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "result." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "boolean":
                    case "bool":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "result." + camelNaming(p.name) + " = jsonObject." + p.name + ";");
                        sb.appendLine(indent2 + "}");
                        break;
                    case "date":
                    case "timespan":
                    case "datetime":
                        sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                        sb.appendLine(indent3 + "result." + camelNaming(p.name) + " = new Date(Date.parse(jsonObject." + p.name + "));");
                        sb.appendLine(indent2 + "}");
                        break;
                }
            }
            else if (_this.isEnum(p.type)) {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "result." + camelNaming(p.name) + " = <" + p.type + ">(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            else if (p.type.indexOf("List") > -1) {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "result." + camelNaming(p.name) + " = " + p.typeWithoutList + ".deserializeEntities(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
            else {
                sb.appendLine(indent2 + "if ((jsonObject." + p.name + " !== undefined) && (jsonObject." + p.name + " !== null)) {");
                sb.appendLine(indent3 + "result." + camelNaming(p.name) + " = " + p.typeWithoutList + ".deserializeEntity(jsonObject." + p.name + ");");
                sb.appendLine(indent2 + "}");
            }
        });
        sb.appendLine(indent2 + "return result;");
        sb.appendLine(indent1 + "}");
        sb.appendLine("}");
    };
    CodeTypeScript.prototype.buildDefinition = function (type, name) {
        var t = "Unsupported";
        if (CodeTypeScript.isBuiltinType(type)) {
            switch (type.toLocaleLowerCase()) {
                case "guid":
                    t = "Guid";
                    break;
                case "int":
                case "long":
                case "float":
                case "double":
                    t = "number";
                    break;
                case "string":
                    t = "string";
                    break;
                case "boolean":
                case "bool":
                    t = "boolean";
                    break;
                case "date":
                case "timespan":
                case "datetime":
                    t = "Date";
                    break;
            }
        }
        else if (this.isEnum(type)) {
            t = type;
        }
        else {
            // Customized classes
            t = type;
        }
        return (name + ": " + t);
    };
    CodeTypeScript.prototype.buildToString = function (type, name) {
        if (CodeTypeScript.isBuiltinType(type)) {
            switch (type.toLocaleLowerCase()) {
                case "boolean":
                case "bool":
                    return "(" + name + " ? \"1\" : \"0\")";
                case "date":
                case "timespan":
                case "datetime":
                    return name + ".toStringWithFormat(\"YYYY-MM-DD HH:mm:ss\")";
                default:
                    return name;
            }
        }
        else if (this.isEnum(type)) {
            return name;
        }
    };
    CodeTypeScript.builtinTypes = ["int", "long", "short", "guid", "bool", "float", "double", "byte", "char", "string", "datetime", "timespan", "decimal"];
    return CodeTypeScript;
}());
//# sourceMappingURL=app.js.map